"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.setPrevState = exports.deleteTask = exports.switchTaskStatus = exports.putTask = exports.getTaskById = exports.getTasks = exports.postTask = void 0;
const socket_users_list_1 = require("../../sockets-config/socket-users-list");
const notification_model_1 = __importDefault(require("../../models/notification.model"));
const task_model_1 = __importDefault(require("../../models/task.model"));
const mongoose_1 = __importDefault(require("mongoose"));
const mongoose_2 = __importDefault(require("mongoose"));
const message_model_1 = __importDefault(require("../../models/message.model"));
const notification_controller_1 = require("./notification-controller");
const socketUsersList = socket_users_list_1.SocketUsersList.instance;
exports.postTask = (req, res) => {
    let body = req.body;
    let task = new task_model_1.default({
        name: body.name,
        description: body.description,
        user: body.userInToken._id,
        participants: body.participants,
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
        taskSaved.populate({
            path: 'participants',
            model: 'User',
            select: 'name _id'
        })
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
        .populate({ path: 'user', model: 'User', select: 'name _id' })
        .populate({ path: 'project', model: 'Project', select: 'name _id' })
        .populate({ path: 'participants', model: 'User', select: 'name _id' })
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
    let body = req.body;
    let id = req.params.id;
    task_model_1.default.findById(id)
        .populate({ path: 'project', model: 'Project', select: 'name _id' })
        .populate({ path: 'participants', model: 'User', select: 'name _id' })
        .exec((err, taskDb) => {
        if (err) {
            return res.status(500).json({ ok: false, err });
        }
        if (!taskDb) {
            return res.status(404).json({ ok: true, message: 'No task has been found with the ID provided' });
        }
        task_model_1.default.findByIdAndUpdate(id, Object.assign({}, body), { new: true })
            .populate({ path: 'project', model: 'Project', select: 'name _id' })
            .populate({ path: 'participants', model: 'User', select: 'name _id' })
            .exec((err, taskUpdated) => {
            if (err) {
                return res.status(500).json({ ok: false, err });
            }
            if (!taskUpdated) {
                return res.status(404).json({ ok: true, message: 'No task has been found with the ID provided' });
            }
            let user = { name: req.body.userInToken.name, _id: req.body.userInToken._id };
            exports.setPrevState(res, taskUpdated, taskDb, user).then((taskUpdated) => {
                createNotification(res, user, taskUpdated, 'PUT', taskDb).then(() => {
                    broadcastTasksEvents(taskUpdated, user._id, 'PUT', taskDb);
                    res.status(200).json({ ok: true, task: taskUpdated });
                });
            });
        });
    });
};
exports.switchTaskStatus = (req, res) => {
    const taskId = req.body.taskId;
    const newStatus = req.body.newStatus;
    const frontTime = req.body.frontTime;
    task_model_1.default.findById(taskId)
        .populate({
        path: 'participants',
        model: 'User',
        select: 'name _id'
    })
        .populate({ path: 'project', model: 'Project', select: 'name _id' })
        .exec((err, taskDb) => {
        if (err) {
            return res.status(500).json({ ok: false, err });
        }
        if (!taskDb) {
            return res.status(404).json({ ok: false, message: 'There are no tasks with the ID provided' });
        }
        switch (taskDb.status) {
            case 'pending':
                taskDb.status = 'on review';
                taskDb.deliverDate = frontTime;
                break;
            case 'on review':
                if (newStatus === 'pending') {
                    taskDb.status = 'pending';
                    taskDb.extraTime += frontTime - taskDb.deliverDate;
                    taskDb.deliverDate = 0;
                }
                else if (newStatus === 'done') {
                    taskDb.status = 'done';
                    taskDb.validationTime = frontTime;
                    taskDb.extraTime += taskDb.validationTime - taskDb.deliverDate;
                }
                break;
            case 'done':
                taskDb.status = 'pending';
                taskDb.extraTime += frontTime - taskDb.validationTime;
                taskDb.validationTime = 0;
                break;
        }
        taskDb.save((err, taskDbUpdated) => {
            if (err) {
                return res.status(500).json({ ok: false, err });
            }
            taskDbUpdated
                .populate({ path: 'participants', model: 'User', select: 'name _id' })
                .populate({ path: 'project', model: 'Project', select: 'name _id' })
                .execPopulate().then((taskPopulated) => {
                let user = { name: req.body.userInToken.name, _id: req.body.userInToken._id };
                exports.setPrevState(res, taskPopulated, taskDb, user).then((taskUpdated) => {
                    createNotification(res, user, taskUpdated, 'STATUS CHANGE', taskDb).then(() => {
                        broadcastTasksEvents(taskUpdated, user._id, 'STATUS CHANGE', taskDb);
                        res.status(200).json({ ok: true, task: taskUpdated });
                    });
                });
            }).catch((err) => {
                res.status(500).json({ ok: false, err });
            });
        });
    });
};
exports.deleteTask = (req, res) => {
    let id = req.params.id;
    task_model_1.default.findByIdAndDelete(id)
        .populate({
        path: 'participants',
        model: 'User',
        select: 'name _id'
    })
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
        task_model_1.default.findByIdAndUpdate(currentTask._id, { $push: { prevStates: prevState } }, { new: true })
            .populate({
            path: 'participants',
            model: 'User',
            select: 'name _id'
        })
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
    let prevState = { user: user._id };
    Object.getOwnPropertyNames(currentTask._doc).forEach((key) => {
        if (key === 'user') {
            prevState[key] = { name: user.name, _id: user._id };
        }
        else {
            if (key === 'participants') {
                let participants = prevTask.get(key);
                let participantsIds = participants.map((p) => { return (p._id).toString(); });
                if (JSON.stringify(participantsIds) != JSON.stringify(currentTask.participants.map((p) => { return p._id; }))) {
                    prevState.participants = participants.map((p) => { return { name: p.name, _id: p._id }; });
                }
            }
            else {
                if (typeof prevTask.get(key) != 'object' && prevTask.get(key) != currentTask.get(key)) {
                    prevState[key] = prevTask.get(key);
                }
            }
        }
    });
    console.log({ prevState });
    return prevState;
};
const createNotification = (res, user, task, method, prevTask) => {
    return new Promise((resolve, reject) => {
        const oldParticipants = prevTask ? prevTask.participants : [];
        const recipients = [...task.participants, ...oldParticipants].map((p) => { return p._id; }).filter((eachParticipant) => { return eachParticipant.toString() != user._id.toString(); });
        let notification = new notification_model_1.default({ project: task.project, task: task._id, type: 'Task', modelName: 'Task', userFrom: user._id, usersTo: recipients.map((p) => { return { checked: false, user: p }; }), method: method, date: new Date().getTime(), item: task._id, oldItem: { name: prevTask.name, _id: prevTask._id } });
        notification_controller_1.postNotification(res, notification).then((notificationToSend) => {
            socketUsersList.broadcastToGroup(user._id, notificationToSend, 'notification', recipients.map((p) => { return p.toString(); }));
            resolve();
        });
    });
};
const broadcastTasksEvents = (task, userId, method, prevTask) => {
    const oldParticipants = prevTask ? prevTask.participants : [];
    const recipients = [...task.participants, ...oldParticipants].map((p) => { return p._id; }).filter((eachParticipant) => { return eachParticipant.toString() != userId.toString(); });
    socketUsersList.broadcastToGroup(userId, { task, method }, 'tasks-event', recipients.map((p) => { return p.toString(); }));
};
