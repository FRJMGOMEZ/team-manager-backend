"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteEvent = exports.toggleEventStatus = exports.putEvent = exports.getEventById = exports.getEventsByTimeRange = exports.postEvent = void 0;
const event_model_1 = __importDefault(require("../../models/event.model"));
const socket_users_list_1 = require("../../sockets-config/socket-users-list");
const notification_model_1 = __importDefault(require("../../models/notification.model"));
/////  escribir una relación entre eventos y pages, porque por ejemplo el dashboard también necesita escuchar los cambios en los eventos //////
const socketUsersList = socket_users_list_1.SocketUsersList.instance;
const broadcastEventsNotification = (user, currentItem, method, oldItem) => {
    const oldParticipants = oldItem ? oldItem.participants : [];
    const participants = [...currentItem.participants, ...oldParticipants].filter((eachParticipant) => { return eachParticipant.toString() != user._id.toString(); });
    let notification = new notification_model_1.default({ type: 'EventModel', userFrom: user._id, usersTo: participants, method: method, checked: false, date: new Date().getTime(), item: currentItem._id, oldItem: oldItem ? { _id: oldItem._id, name: oldItem.name, participants: oldParticipants } : null });
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
        socketUsersList.broadcast(user._id, notificationToSend, 'events-change', currentItem.project._id.toString());
    });
};
exports.postEvent = (req, res) => {
    let body = req.body;
    let event = new event_model_1.default({
        name: body.name,
        description: body.description,
        user: body.userInToken._id,
        participants: body.participants,
        project: body.project ? body.project : null,
        startDate: body.startDate,
        endDate: body.endDate,
        recursive: body.recursive,
        allDay: body.allDay,
        startTime: body.startTime,
        endTime: body.endTime,
    });
    event.save((err, eventSaved) => {
        if (err) {
            return res.status(500).json({ ok: false, err });
        }
        event.populate({
            path: 'project',
            model: 'Project',
            select: 'name _id'
        }, (err, eventDb) => {
            if (err) {
                return res.status(500).json({ ok: false, err });
            }
            res.status(200).json({ ok: true, event: eventDb });
        });
        let user = req.body.userInToken;
        broadcastEventsNotification(user, eventSaved, 'POST');
    });
};
exports.getEventsByTimeRange = (req, res) => {
    const from = Number(req.query.from);
    const to = Number(req.query.to);
    let user = req.body.userInToken;
    const selector = req.params.selector;
    let query = {};
    let projectId = req.query.projectId;
    switch (selector) {
        case 'day':
            query = { startDate: { $lte: from }, endDate: { $gte: from }, project: projectId };
            break;
        case 'month':
            query = { startDate: { $lte: to }, endDate: { $gte: from }, project: projectId };
            break;
        case 'week':
            query = { startDate: { $lte: to }, endDate: { $gte: from }, project: projectId };
            break;
    }
    let recursiveFilter = Number(req.query.recursiveFilter);
    event_model_1.default.find(query, (err, eventsDb) => {
        if (err) {
            console.log({ err });
            return res.status(500).json({ ok: false, err });
        }
        eventsDb = recursiveFilter ? eventsDb.filter((eachEvent) => { return !eachEvent.recursive || (new Date(eachEvent.startDate).getDay() === new Date(recursiveFilter).getDay()); }) : eventsDb;
        eventsDb = user.role === 'ADMIN_ROLE' ? eventsDb : eventsDb.filter((eachEvent) => { return (eachEvent.participants.includes(user._id.toString())); });
        res.status(200).json({ ok: true, events: eventsDb });
    });
};
exports.getEventById = (req, res) => {
    let id = req.params.id;
    event_model_1.default.findById(id)
        .populate('user')
        .populate('participants')
        .populate('project')
        .exec((err, eventDb) => {
        if (err) {
            console.log({ err });
            return res.status(500).json({ ok: false, err });
        }
        if (!eventDb) {
            return res.status(404).json({ ok: false, message: 'No user has been found with the ID provided' });
        }
        res.status(200).json({ ok: true, event: eventDb });
    });
};
exports.putEvent = (req, res) => {
    let body = req.body;
    let id = req.params.id;
    event_model_1.default.findByIdAndUpdate(id, Object.assign({}, body))
        .populate({
        path: 'project',
        model: 'Project',
        select: 'name _id'
    })
        .exec((err, eventDb) => {
        if (err) {
            return res.status(500).json({ ok: false, err });
        }
        if (!eventDb) {
            return res.status(404).json({ ok: true, message: 'No Event has been found with the ID provided' });
        }
        let user = req.body.userInToken;
        event_model_1.default.findById(id, (err, eventUpdated) => {
            if (err) {
                return res.status(500).json({ ok: false, err });
            }
            console.log({ eventDb });
            res.status(200).json({ ok: true, event: eventUpdated });
            broadcastEventsNotification(user, eventUpdated, 'PUT', eventDb);
        });
    });
};
exports.toggleEventStatus = (req, res) => {
    let status = req.body.status;
    let eventId = req.params.id;
    event_model_1.default.findByIdAndUpdate(eventId, { status }, { new: true }, (err, eventUpdated) => {
        if (err) {
            return res.status(500).json({ ok: false, err });
        }
        if (!eventUpdated) {
            return res.status(404).json({ ok: true, message: 'No Event has been found with the ID provided' });
        }
        res.status(200).json({ ok: true, event: eventUpdated });
    });
};
exports.deleteEvent = (req, res) => {
    let id = req.params.id;
    event_model_1.default.findByIdAndDelete(id)
        .populate({
        path: 'project',
        model: 'Project',
        select: 'name _id'
    })
        .exec((err, eventDeleted) => {
        if (err) {
            return res.status(500).json({ ok: false, err });
        }
        if (!eventDeleted) {
            return res.status(404).json({ ok: true, message: 'No Event has been found with the ID provided' });
        }
        res.status(200).json({ ok: true, event: eventDeleted });
        let user = req.body.userInToken;
        console.log({ eventDeleted });
        broadcastEventsNotification(user, eventDeleted, 'DELETE');
    });
};
