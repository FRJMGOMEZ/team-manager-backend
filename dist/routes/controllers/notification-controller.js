"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.toggleNotification = exports.getNotificationById = exports.getNotifications = exports.putNotification = exports.postNotification = exports.broadcastNotification = void 0;
const notification_model_1 = __importDefault(require("../../models/notification.model"));
const mongoose_1 = __importDefault(require("mongoose"));
const socket_users_list_1 = require("../../sockets-config/socket-users-list");
const socketUsersList = socket_users_list_1.SocketUsersList.instance;
exports.broadcastNotification = (notification, userId, room) => {
    socketUsersList.broadcast(userId, notification, 'notification', room);
};
exports.postNotification = (res, notification) => {
    return new Promise((resolve, reject) => {
        notification.save((err, notificationSaved) => {
            if (err) {
                reject(res.status(500).json({ ok: false, err }));
            }
            notificationSaved
                .populate({ path: 'project', model: 'Project', select: 'name _id' })
                .populate({ path: 'userFrom', model: 'User' })
                .populate({ path: 'item', model: notification.type, select: 'name _id participants' })
                .populate({ path: 'actionsRequired', model: 'ActionRequired', select: 'usersTo' })
                .populate('task').execPopulate().then((notificationToSend) => {
                if (err) {
                    reject(res.status(500).json({ ok: false, err }));
                }
                resolve(notificationToSend);
            }).catch((err) => {
                reject(res.status(500).json({ ok: false, err }));
            });
        });
    });
};
exports.putNotification = (req, res) => {
    notification_model_1.default.findByIdAndUpdate(req.params.id, req.body.changes)
        .populate({ path: 'userFrom', model: 'User', select: 'name _id' })
        .populate({ path: 'project', model: 'Project', select: 'name' })
        .populate({ path: 'actionsRequired', model: 'ActionRequired', select: 'usersTo' })
        .exec((err, notificationDb) => {
        if (err) {
            return res.status(500).json({ ok: false, err });
        }
        if (!notificationDb) {
            return res.status(404).json({ ok: false, message: 'No notification has been found with the ID provided' });
        }
        res.status(200).json({ ok: true, notification: notificationDb });
    });
};
exports.getNotifications = (req, res) => {
    const skip = Number(req.headers.skip);
    const limit = Number(req.headers.limit);
    const from = '';
    const to = '';
    const project = req.query.project;
    const userTo = req.query.userTo;
    const userFrom = req.query.userForm;
    const checked = req.query.checked;
    const specialQuerys = ['from', 'to', 'userTo', 'checked', 'userFrom', 'project'];
    let querys = Object.keys(req.query).reduce((acum, key) => { !specialQuerys.includes(key) ? acum[key] = req.query[key] : null; return acum; }, {});
    userTo ? querys['usersTo.user'] = mongoose_1.default.Types.ObjectId(userTo) : null;
    checked ? querys['usersTo.checked'] = checked : null;
    userFrom ? querys.userFrom = mongoose_1.default.Types.ObjectId(userFrom) : null;
    notification_model_1.default.count(Object.assign(Object.assign({}, querys), { date: { $gte: from ? from : 0, $lte: to ? to : 9999999999999 } }), (err, count) => {
        if (err) {
            return res.status(500).json({ ok: false, err });
        }
        notification_model_1.default
            .find(querys)
            .sort({ _id: -1 })
            .skip(skip)
            .limit(limit)
            .populate({ path: 'userFrom', model: 'User', select: 'name _id' })
            .populate({ path: 'project', model: 'Project', select: 'name' })
            .populate({ path: 'actionsRequired', model: 'ActionRequired', select: 'usersTo' })
            .exec((err, notificationsDb) => {
            if (err) {
                return res.status(500).json({ ok: false, err });
            }
            const notifications = project ? notificationsDb.filter((n) => { return n.project.name.includes(project); }) : notificationsDb;
            count -= notificationsDb.length - notifications.length;
            notificationsDb = notifications;
            res.status(200).json({ ok: true, notifications: notificationsDb, count });
        });
    });
};
exports.getNotificationById = (req, res) => {
    const id = req.params.id;
    notification_model_1.default.findById(id)
        .populate({ path: 'userFrom', model: 'User' })
        .exec((err, notificationDb) => {
        if (err) {
            return res.status(500).json({ ok: false, err });
        }
        if (!notificationDb) {
            return res.status(404).json({ ok: false, message: 'There are no notifications with the ID provided' });
        }
        res.status(200).json({ ok: true, notification: notificationDb });
    });
};
const deleteNot = (res, notificationId) => {
    return new Promise((resolve, reject) => {
        notification_model_1.default.findByIdAndDelete(notificationId, (err, notificationDeleted) => {
            if (err) {
                reject(res.status(500).json({ ok: false, err }));
            }
            if (!notificationDeleted) {
                reject(res.status(404).json({ ok: false, message: 'No notification has been found with the ID provided' }));
            }
            resolve(true);
        });
    });
};
const saveNot = (res, notification) => {
    return new Promise((resolve, reject) => {
        notification.save((err, notificationUpdated) => {
            if (err) {
                reject(res.status(500).json({ ok: false, err }));
            }
            if (!notificationUpdated) {
                reject(res.status(404).json({ ok: false, message: 'No notification has been found with the ID provided' }));
            }
            resolve(true);
        });
    });
};
exports.toggleNotification = (req, res) => {
    const notificationId = req.body.notificationId;
    const itemId = req.body.itemId;
    const request = notificationId ? notification_model_1.default.findById(notificationId) : notification_model_1.default.find({ item: itemId });
    request
        .populate({ path: 'userFrom', model: 'User', select: 'name _id' })
        .populate({ path: 'project', model: 'Project', select: 'name' })
        .populate({ path: 'actionsRequired', model: 'ActionRequired', select: 'usersTo' })
        .exec((err, notificationDb) => {
        if (err) {
            return res.status(500).json({ ok: false, err });
        }
        if (!notificationDb) {
            return res.status(404).json({ ok: false, message: 'No notification has been found with the ID provided' });
        }
        const userId = req.body.userInToken._id.toString();
        notificationDb.usersTo = notificationDb.usersTo.map((ut) => { if (ut.user.toString() === userId) {
            ut.checked = !ut.checked;
            return ut;
        } ; return ut; });
        saveNot(res, notificationDb).then(() => {
            res.status(200).json({ ok: true, notification: notificationDb });
        });
    });
};
