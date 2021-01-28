"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.toggleNotification = exports.getNotificationById = exports.getNotifications = exports.postNotification = exports.broadcastNotification = void 0;
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
                .populate({ path: 'project', model: 'Project', select: 'name' })
                .populate({ path: 'item', model: notification.modelName })
                .populate({ path: 'userFrom', model: 'User' })
                .populate('task').execPopulate().then((notificationToSend) => {
                if (err) {
                    reject(res.status(500).json({ ok: false, err }));
                }
                resolve(notificationToSend);
            }).catch((err) => {
                console.log({ err });
                reject(res.status(500).json({ ok: false, err }));
            });
        });
    });
};
exports.getNotifications = (req, res) => {
    const skip = Number(req.headers.skip);
    const limit = Number(req.headers.limit);
    const id = req.params.userId;
    const objId = mongoose_1.default.Types.ObjectId(id);
    const checked = req.query.checked;
    let querys = { 'usersTo.user': objId };
    checked ? querys['usersTo.checked'] = checked : null;
    notification_model_1.default.count(querys, (err, count) => {
        if (err) {
            return res.status(500).json({ ok: false, err });
        }
        notification_model_1.default
            .find(querys)
            .skip(count - (limit + skip) >= 0 ? count - (limit + skip) : 0)
            .limit(count - skip)
            .populate({ path: 'userFrom', model: 'User', select: 'name _id' })
            .populate({ path: 'project', model: 'Project', select: 'name' })
            .exec((err, notificationsDb) => {
            if (err) {
                return res.status(500).json({ ok: false, err });
            }
            console.log(notificationsDb.length);
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
    request.exec((err, notificationDb) => {
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
        if (notificationDb.usersTo.filter((r) => { return !r.checked; }).length === 0) {
            deleteNot(res, notificationDb._id).then(() => {
                res.status(200).json({ ok: true });
            });
        }
        else {
            saveNot(res, notificationDb).then(() => {
                res.status(200).json({ ok: true });
            });
        }
    });
};
