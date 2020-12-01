"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteTask = exports.toggleTaskStatus = exports.putTask = exports.getTaskById = exports.getTasks = exports.postTask = void 0;
const socket_users_list_1 = require("../../sockets-config/socket-users-list");
const notification_model_1 = __importDefault(require("../../models/notification.model"));
const task_model_1 = __importDefault(require("../../models/task.model"));
const mongoose_1 = __importDefault(require("mongoose"));
const mongoose_2 = __importDefault(require("mongoose"));
const socketUsersList = socket_users_list_1.SocketUsersList.instance;
const broadcastTasksNotification = (user, currentItem, method, oldItem) => {
    if (oldItem) {
        oldItem.participants = oldItem.participants.map((p) => { return p._id; });
    }
    currentItem.participants = currentItem.participants.map((p) => { return p._id; });
    const oldParticipants = oldItem ? oldItem.participants : [];
    const participants = [...currentItem.participants, ...oldParticipants].filter((eachParticipant) => { return eachParticipant.toString() != user._id.toString(); });
    let notification = new notification_model_1.default({ type: 'TaskModel', userFrom: user._id, usersTo: participants, method: method, checked: false, date: new Date().getTime(), item: currentItem._id, oldItem: oldItem ? { _id: oldItem._id, name: oldItem.name, participants: oldParticipants } : null });
    notification.save((err, notificationSaved) => {
        if (err) {
            throw (err);
        }
        let notificationToSend = {
            type: notification.type,
            userFrom: user,
            usersTo: participants,
            method,
            checked: false,
            date: notification.date,
            item: currentItem,
            oldItem: notification.oldItem,
            _id: notificationSaved._id
        };
        socketUsersList.broadcast(user._id, notificationToSend, 'tasks-change', currentItem.project._id.toString());
    });
};
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
        task.populate({
            path: 'project',
            model: 'Project',
            select: 'name _id'
        }, (err, taskDb) => {
            if (err) {
                return res.status(500).json({ ok: false, err });
            }
            res.status(200).json({ ok: true, task: taskDb });
        });
        let user = req.body.userInToken;
        broadcastTasksNotification(user, taskSaved, 'POST');
    });
};
exports.getTasks = (req, res) => {
    const from = req.query.from ? Number(req.query.from) : -8640000000000000;
    const to = req.query.to ? Number(req.query.to) : 8640000000000000;
    const selector = req.params.selector;
    let participants = req.query.participants ? req.query.participants : null;
    if (participants != null) {
        participants = participants.reduce((acum, string) => {
            acum.push(...string.split(','));
            return acum;
        }, []);
        participants = participants.map((p) => { return new mongoose_1.default.Types.ObjectId(p); });
    }
    let query = {};
    let querys = Object.keys(req.query).reduce((acum, key) => { key != 'from' && key != 'to' ? acum[key] = req.query[key] : null; return acum; }, {});
    if (querys._id && !mongoose_2.default.isValidObjectId(querys._id)) {
        return res.status(400).json({ ok: false, message: 'THE ID INTRODUCED HAS A WRONG FORMAT' });
    }
    switch (selector) {
        case 'day':
            query = Object.assign(Object.assign({ startDate: { $lte: from }, endDate: { $gte: from } }, querys), { participants: participants != null ? { $in: participants } : { $ne: null } });
            break;
        case 'month':
            query = Object.assign(Object.assign({ startDate: { $lte: to }, endDate: { $gte: from } }, querys), { participants: participants != null ? { $in: participants } : { $ne: null } });
            break;
        case 'week':
            query = Object.assign(Object.assign({ startDate: { $lte: to }, endDate: { $gte: from } }, querys), { participants: participants != null ? { $in: participants } : { $ne: null } });
            break;
    }
    task_model_1.default.find(query, (err, tasksDb) => {
        if (err) {
            return res.status(500).json({ ok: false, err });
        }
        res.status(200).json({ ok: true, tasks: tasksDb });
    });
};
exports.getTaskById = (req, res) => {
    let id = req.params.id;
    task_model_1.default.findById(id)
        .populate({ path: 'user', model: 'User', select: 'name _id' })
        .populate({ path: 'participants', model: 'User', select: 'name _id' })
        .populate('project')
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
    task_model_1.default.findById(id, (err, taskDb) => {
        if (err) {
            return res.status(500).json({ ok: false, err });
        }
        if (!taskDb) {
            return res.status(404).json({ ok: true, message: 'No task has been found with the ID provided' });
        }
        task_model_1.default.findByIdAndUpdate(id, Object.assign({}, body))
            .populate({
            path: 'project',
            model: 'Project',
            select: 'name _id'
        })
            .populate({
            path: 'participants',
            model: 'User',
            select: 'name _id'
        })
            .exec((err, taskDb) => {
            if (err) {
                return res.status(500).json({ ok: false, err });
            }
            if (!taskDb) {
                return res.status(404).json({ ok: true, message: 'No task has been found with the ID provided' });
            }
            let prevState = calculatePrevState(req.body, taskDb);
            let user = { name: req.body.userInToken.name, _id: req.body.userInToken._id };
            task_model_1.default.findByIdAndUpdate(id, { $push: { prevStates: prevState } }, { new: true })
                .populate({
                path: 'user',
                model: 'User',
                select: 'name _id'
            })
                .populate({
                path: 'participants',
                model: 'User',
                select: 'name _id'
            })
                .exec((err, taskUpdated) => {
                if (err) {
                    return res.status(500).json({ ok: false, err });
                }
                res.status(200).json({ ok: true, task: taskUpdated });
                broadcastTasksNotification(user, taskUpdated, 'PUT', taskDb);
            });
        });
    });
};
const calculatePrevState = (body, taskDb) => {
    let prevState = { user: body.userInToken._id };
    Object.keys(body).forEach((key) => {
        if (key != 'userInToken') {
            if (key === 'user') {
                prevState[key] = { name: body.userInToken.name, _id: body.userInToken._id };
            }
            else {
                if (key === 'participants') {
                    let participants = taskDb.get(key);
                    let participantsIds = participants.map((p) => { return (p._id).toString(); });
                    if (JSON.stringify(participantsIds) != JSON.stringify(body[key])) {
                        prevState[key] = participants.map((p) => { return { name: p.name, _id: p._id }; });
                    }
                }
                else {
                    if (taskDb.get(key) != body[key]) {
                        prevState[key] = taskDb.get(key);
                    }
                }
            }
        }
    });
    return prevState;
};
exports.toggleTaskStatus = (req, res) => {
    let status = req.body.status;
    let taskId = req.params.id;
    task_model_1.default.findByIdAndUpdate(taskId, { status }, { new: true }, (err, taskUpdated) => {
        if (err) {
            return res.status(500).json({ ok: false, err });
        }
        if (!taskUpdated) {
            return res.status(404).json({ ok: true, message: 'No task has been found with the ID provided' });
        }
        res.status(200).json({ ok: true, task: taskUpdated });
    });
};
exports.deleteTask = (req, res) => {
    let id = req.params.id;
    task_model_1.default.findByIdAndDelete(id)
        .populate({
        path: 'project',
        model: 'Project',
        select: 'name _id'
    })
        .exec((err, taskDeleted) => {
        if (err) {
            return res.status(500).json({ ok: false, err });
        }
        if (!taskDeleted) {
            return res.status(404).json({ ok: true, message: 'No task has been found with the ID provided' });
        }
        res.status(200).json({ ok: true, task: taskDeleted });
        let user = req.body.userInToken;
        console.log({ taskDeleted });
        broadcastTasksNotification(user, taskDeleted, 'DELETE');
    });
};
