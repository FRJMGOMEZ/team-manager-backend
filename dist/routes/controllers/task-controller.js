"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.setPrevState = exports.deleteTask = exports.putTask = exports.getTaskById = exports.getTasks = exports.postTask = void 0;
const socket_users_list_1 = require("../../sockets-config/socket-users-list");
const notification_model_1 = __importDefault(require("../../models/notification.model"));
const task_model_1 = __importDefault(require("../../models/task.model"));
const mongoose_1 = __importDefault(require("mongoose"));
const mongoose_2 = __importDefault(require("mongoose"));
const message_model_1 = __importDefault(require("../../models/message.model"));
const notification_controller_1 = require("./notification-controller");
const actions_required_controller_1 = require("./actions-required.controller");
const ACTIONS_REQUIRED_PROPERTIES = ['status'];
const PREV_VERSION_SKIP_PROPERTIES = ['actionsRequired', '_id'];
const socketUsersList = socket_users_list_1.SocketUsersList.instance;
exports.postTask = (req, res) => {
    let body = req.body;
    let task = new task_model_1.default({
        name: body.name,
        description: body.description,
        createdBy: body.userInToken._id,
        participants: body.participants,
        reviewers: body.reviewers,
        project: body.project ? body.project : null,
        startDate: body.startDate,
        endDate: body.endDate,
        priority: body.priority,
        prevStates: []
    });
    task.save((err, taskSaved) => {
        if (err) {
            return res.status(500).json({ ok: false, err });
        }
        taskSaved
            .populate({ path: 'participants', model: 'User', select: 'name _id' })
            .populate({ path: 'reviewers', model: 'User', select: 'name _id' })
            .populate({ path: 'createdBy', model: 'User', select: 'name _id' })
            .populate({ path: 'actionsRequired', model: 'ActionRequired', populate: [{ path: 'usersTo', model: 'User', select: 'name _id' }, { path: 'userFrom', model: 'User', select: 'name _id' }] })
            .execPopulate().then((taskSaved) => {
            let user = req.body.userInToken;
            createNotification(res, user, taskSaved, 'POST', taskSaved).then(() => {
                broadcastTasksEvents(taskSaved, user._id, 'POST');
                res.status(200).json({ ok: true, task: taskSaved });
            });
        }).catch((err) => {
            res.status(500).json({ ok: false, err });
        });
    });
};
exports.getTasks = (req, res) => {
    const skip = Number(req.headers.skip);
    const limit = Number(req.headers.limit);
    const from = req.query.from ? Number(req.query.from) : -8640000000000000;
    const to = req.query.to ? Number(req.query.to) : 8640000000000000;
    let participants = req.query.participants ? req.query.participants.includes(req.body.userInToken._id.toString()) ? req.query.participants : [...req.query.participants, req.body.userInToken] : [req.body.userInToken._id];
    if (participants != null) {
        participants = participants.reduce((acum, string) => {
            acum.push(...string.split(','));
            return acum;
        }, []);
        participants = participants.map((p) => { return new mongoose_1.default.Types.ObjectId(p); });
    }
    let querys = Object.keys(req.query).reduce((acum, key) => { key != 'from' && key != 'to' ? acum[key] = req.query[key] : null; return acum; }, {});
    if (querys._id && !mongoose_2.default.isValidObjectId(querys._id)) {
        return res.status(400).json({ ok: false, message: 'THE ID INTRODUCED HAS A WRONG FORMAT' });
    }
    const query = Object.assign(Object.assign({ startDate: { $lte: to }, endDate: { $gte: from } }, querys), { participants: { $in: participants } });
    task_model_1.default.find(query).skip(skip).limit(limit).exec((err, tasksDb) => {
        if (err) {
            return res.status(500).json({ ok: false, err });
        }
        task_model_1.default.find(query).countDocuments((err, count) => {
            res.status(200).json({ ok: true, tasks: tasksDb, count });
        });
    });
};
exports.getTaskById = (req, res) => {
    let id = req.params.id;
    task_model_1.default.findById(id)
        .populate({ path: 'createdBy', model: 'User', select: 'name _id' })
        .populate({ path: 'project', model: 'Project', select: 'name _id' })
        .populate({ path: 'participants', model: 'User', select: 'name _id' })
        .populate({ path: 'reviewers', model: 'User', select: 'name _id' })
        .populate({ path: 'actionsRequired', model: 'ActionRequired', populate: [{ path: 'usersTo', model: 'User', select: 'name _id' }, { path: 'userFrom', model: 'User', select: 'name _id' }] })
        .exec((err, taskDb) => {
        if (err) {
            return res.status(500).json({ ok: false, err });
        }
        if (!taskDb) {
            return res.status(404).json({ ok: false, message: 'No user has been found with the ID provided' });
        }
        res.status(200).json({ ok: true, task: taskDb });
    });
};
exports.putTask = (req, res) => {
    let changes = req.body.changes;
    let id = req.params.id;
    task_model_1.default.findById(id)
        .populate({ path: 'project', model: 'Project', select: 'name _id' })
        .populate({ path: 'participants', model: 'User', select: 'name _id' })
        .populate({ path: 'reviewers', model: 'User', select: 'name _id' })
        .populate({ path: 'actionsRequired', model: 'ActionRequired', select: 'property' })
        .populate({ path: 'createdBy', model: 'User', select: 'name _id' })
        .exec((err, taskDb) => {
        if (err) {
            return res.status(500).json({ ok: false, err });
        }
        if (!taskDb) {
            return res.status(404).json({ ok: true, message: 'No task has been found with the ID provided' });
        }
        const taskPrev = JSON.parse(JSON.stringify(taskDb._doc));
        const actionsRequiredOperations = [];
        Object.keys(changes).forEach((k) => {
            if (ACTIONS_REQUIRED_PROPERTIES.includes(k)) {
                switch (k) {
                    case 'status':
                        actionsRequiredOperations.push(setStatusChange(res, taskDb, changes.status, req.body.userInToken));
                        break;
                }
            }
            else {
                taskDb.set(k, changes[k]);
            }
        });
        Promise.all(actionsRequiredOperations).then((response) => {
            if (response.length) {
                taskDb = response[response.length - 1];
            }
            taskDb.save((err, taskDbUpdated) => {
                if (err) {
                    return res.status(500).json({ ok: false, err });
                }
                taskDbUpdated
                    .populate({ path: 'participants', model: 'User', select: 'name _id' })
                    .populate({ path: 'project', model: 'Project', select: 'name _id' })
                    .populate({ path: 'reviewers', model: 'User', select: 'name _id' })
                    .populate({ path: 'createdBy', model: 'User', select: 'name _id' })
                    .execPopulate().then((taskPopulated) => {
                    let user = { name: req.body.userInToken.name, _id: req.body.userInToken._id };
                    exports.setPrevState(res, taskPopulated, taskPrev, user).then((taskUpdated) => {
                        createNotification(res, user, taskUpdated, 'PUT', taskDb, actionsRequiredOperations.length > 0 ? taskDb.actionsRequired.map((ar) => ar._id) : []).then(() => {
                            broadcastTasksEvents(taskUpdated, user._id, 'PUT', taskDb);
                            res.status(200).json({ ok: true, task: taskUpdated });
                        });
                    });
                }).catch((err) => {
                    res.status(500).json({ ok: false, err });
                });
            });
        });
    });
};
const setStatusChange = (res, taskDb, newStatus, user) => {
    return new Promise((resolve, reject) => {
        let actionRequiredProm = Promise.resolve(taskDb);
        switch (taskDb.status) {
            case 'pending':
                taskDb.status = 'on review';
                taskDb.deliverDate = new Date().getTime();
                actionRequiredProm = actions_required_controller_1.setActionRequired(res, taskDb, 'status', ['done', 'pending'], user, 'Task');
                break;
            case 'on review':
                if (newStatus === 'pending') {
                    taskDb.status = 'pending';
                    taskDb.extraTime = taskDb.extraTime ? taskDb.extraTime + new Date().getTime() - taskDb.deliverDate : new Date().getTime() - taskDb.deliverDate;
                    taskDb.deliverDate = 0;
                }
                else if (newStatus === 'done') {
                    taskDb.status = 'done';
                    taskDb.validationTime = new Date().getTime();
                    taskDb.extraTime = taskDb.extraTime ? taskDb.extraTime + new Date().getTime() - taskDb.deliverDate : new Date().getTime() - taskDb.deliverDate;
                }
                actionRequiredProm = actions_required_controller_1.removeActionRequired(res, taskDb, 'status');
                break;
            case 'done':
                taskDb.status = 'pending';
                taskDb.extraTime = taskDb.extraTime ? taskDb.extraTime + new Date().getTime() - taskDb.validationTime : new Date().getTime() - taskDb.validationTime;
                taskDb.validationTime = 0;
                actionRequiredProm = Promise.resolve(taskDb);
                break;
        }
        actionRequiredProm.then((taskDb) => {
            resolve(taskDb);
        });
    });
};
exports.deleteTask = (req, res) => {
    let id = req.params.id;
    task_model_1.default.findByIdAndDelete(id)
        .populate({ path: 'participants', model: 'User', select: 'name _id' })
        .populate({ path: 'reviewers', model: 'User', select: 'name _id' })
        .exec((err, taskDeleted) => {
        if (err) {
            return res.status(500).json({ ok: false, err });
        }
        if (!taskDeleted) {
            return res.status(404).json({ ok: true, message: 'No task has been found with the ID provided' });
        }
        message_model_1.default.deleteMany({ task: taskDeleted._id }).exec((err, messagesDeleted) => {
            if (err) {
                return res.status(500).json({ ok: false, err });
            }
            let user = req.body.userInToken;
            createNotification(res, user, taskDeleted, 'DELETE', taskDeleted).then(() => {
                broadcastTasksEvents(taskDeleted, user._id, 'DELETE', taskDeleted);
                res.status(200).json({ ok: true, task: taskDeleted });
            });
        });
    });
};
exports.setPrevState = (res, currentTask, prevTask, user) => {
    return new Promise((resolve, reject) => {
        let prevState = calculatePrevState(currentTask, prevTask, user);
        if (Object.keys(prevState.changes).length === 0) {
            return res.status(403).json({ ok: false, message: 'The version you want to restore is equal to the current one' });
        }
        task_model_1.default.findByIdAndUpdate(currentTask._id, { $push: { prevStates: prevState } }, { new: true })
            .populate({ path: 'participants', model: 'User', select: 'name _id' })
            .populate({ path: 'reviewers', model: 'User', select: 'name _id' })
            .populate({ path: 'createdBy', model: 'User', select: 'name _id' })
            .populate({ path: 'actionsRequired', model: 'ActionRequired', populate: [{ path: 'usersTo', model: 'User', select: 'name _id' }, { path: 'userFrom', model: 'User', select: 'name _id' }] })
            .exec((err, taskUpdated) => {
            if (err) {
                reject(res.status(500).json({ ok: false, err }));
            }
            if (!taskUpdated) {
                reject(res.status(404).json({ ok: false, message: 'There are no tasks with the ID provided' }));
            }
            resolve(taskUpdated);
        });
    });
};
const calculatePrevState = (currentTask, prevTask, user) => {
    let prevState = { user: { name: user.name, _id: user._id }, date: new Date().getTime(), changes: {} };
    prevTask = prevTask['_doc'] ? prevTask['_doc'] : prevTask;
    Object.getOwnPropertyNames(currentTask._doc).forEach((key) => {
        if ((key === 'participants' || key === 'reviewers') && (JSON.stringify(prevTask[key]) != JSON.stringify(currentTask.get(key)))) {
            prevState.changes[key] = prevTask[key].map((u) => { return { _id: u._id, name: u.name }; });
        }
        else if (!PREV_VERSION_SKIP_PROPERTIES.includes(key)) {
            if (JSON.stringify(prevTask[key]) != JSON.stringify(currentTask.get(key))) {
                prevState.changes[key] = prevTask[key];
            }
        }
    });
    return prevState;
};
const createNotification = (res, user, task, method, prevTask, actionsRequired = []) => {
    return new Promise((resolve, reject) => {
        const oldParticipants = prevTask ? prevTask.participants : [];
        let recipients = [...task.participants, ...oldParticipants].map((u) => { return u._id.toString(); }).filter((u) => { return u.toString() != user._id; });
        recipients = [...new Set(recipients)];
        let notification = new notification_model_1.default({ project: task.project, task: task._id, type: 'Task', modelName: 'Task', userFrom: user._id, usersTo: recipients.map((p) => { return { checked: false, user: p }; }), method: method, date: new Date().getTime(), item: task._id, prevItem: { name: prevTask.name, _id: prevTask._id }, actionsRequired });
        notification_controller_1.postNotification(res, notification).then((notificationToSend) => {
            socketUsersList.broadcastToGroup(user._id, notificationToSend, 'notification', recipients, true);
            resolve();
        });
    });
};
const broadcastTasksEvents = (task, userId, method, prevTask) => {
    const oldParticipants = prevTask ? prevTask.participants : [];
    const recipients = [...task.participants, ...oldParticipants].filter((eachParticipant) => { return eachParticipant._id.toString() != userId.toString(); }).map((u) => { return u._id; });
    socketUsersList.broadcastToGroup(userId, { task, method }, 'tasks-event', recipients.map((p) => { return p.toString(); }));
};
//# sourceMappingURL=task-controller.js.map