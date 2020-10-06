"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getNotifications = exports.toggleNotification = void 0;
const notification_model_1 = __importDefault(require("../../models/notification.model"));
const mongoose_1 = __importDefault(require("mongoose"));
exports.toggleNotification = (req, res) => {
    let id = req.params.id;
    let checked = req.body.checked;
    notification_model_1.default.findByIdAndUpdate(id, { checked }, (err, notificationUpdated) => {
        if (err) {
            return res.status(500).json({ ok: false, err });
        }
        if (!notificationUpdated) {
            return res.status(404).json({ ok: false, message: 'No notification has been found with the ID provided' });
        }
        res.status(200).json({ ok: true, notification: notificationUpdated });
    });
};
exports.getNotifications = (req, res) => {
    let id = req.params.userId;
    let objId = mongoose_1.default.Types.ObjectId(id);
    notification_model_1.default
        .find({ usersTo: objId })
        .populate({ path: 'userFrom', model: 'User' })
        .populate({ path: 'item', model: 'EventModel' })
        .exec((err, notificationsDb) => {
        if (err) {
            res.status(500).json({ ok: false, err });
        }
        res.status(200).json({ ok: true, notifications: notificationsDb });
    });
};
