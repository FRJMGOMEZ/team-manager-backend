"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteEvent = exports.toggleEventStatus = exports.putEvent = exports.getEventById = exports.getEventsByTimeRange = exports.postEvent = void 0;
const event_model_1 = __importDefault(require("../../models/event.model"));
const socket_users_list_1 = require("../../sockets-config/socket-users-list");
/////  escribir una relación entre eventos y pages, porque por ejemplo el dashboard también necesita escuchar los cambios en los eventos //////
const socketUsersList = socket_users_list_1.SocketUsersList.instance;
const broadcastEventsChange = (userId, payload) => {
    console.log({ userId, payload });
    socketUsersList.broadcast(userId, payload, 'events-change');
};
exports.postEvent = (req, res) => {
    let body = req.body;
    let event = new event_model_1.default({
        name: body.name,
        description: body.description,
        user: body.user,
        participants: body.participants,
        project: body.project ? body.project : null,
        startDate: body.startDate,
        endDate: body.endDate,
        recursive: body.recursive,
        startTime: body.startTime,
        endTime: body.endTime,
    });
    event.save((err, eventSaved) => {
        if (err) {
            return res.status(500).json({ ok: false, err });
        }
        res.status(200).json({ ok: true, event: eventSaved });
        let user = req.body.user;
        broadcastEventsChange(user._id, { event: eventSaved, method: 'POST', user: user.name });
    });
};
exports.getEventsByTimeRange = (req, res) => {
    const from = Number(req.query.from);
    const to = Number(req.query.to);
    let user = req.body.user;
    const selector = req.params.selector;
    let query = {};
    let projectId = req.query.projectId;
    switch (selector) {
        case 'day':
            query = { startDate: { $lte: to }, endDate: { $gte: to }, project: projectId };
            break;
        case 'month':
            query = { startDate: { $gte: from }, endDate: { $lte: to }, project: projectId };
            break;
    }
    let recursiveFilter = Number(req.query.recursiveFilter);
    event_model_1.default.find(query, (err, eventsDb) => {
        if (err) {
            return res.status(500).json({ ok: false, err });
        }
        eventsDb = recursiveFilter ? eventsDb.filter((eachEvent) => { return !eachEvent.recursive || (new Date(eachEvent.startDate).getDay() === new Date(recursiveFilter).getDay()); }) : eventsDb;
        eventsDb = user.role === 'ADMIN_ROLE' ? eventsDb : eventsDb.filter((eachEvent) => { return (eachEvent.participants.includes(user._id.toString())); });
        console.log();
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
    console.log(req.body);
    let body = req.body;
    let id = req.params.id;
    event_model_1.default.findByIdAndUpdate(id, Object.assign({}, body))
        .exec((err, eventDb) => {
        if (err) {
            return res.status(500).json({ ok: false, err });
        }
        if (!eventDb) {
            return res.status(404).json({ ok: true, message: 'No Event has been found with the ID provided' });
        }
        let user = req.body.user;
        event_model_1.default.findById(id, (err, eventUpdated) => {
            if (err) {
                return res.status(500).json({ ok: false, err });
            }
            res.status(200).json({ ok: true, event: eventUpdated });
            broadcastEventsChange(user._id, { event: eventUpdated, method: 'PUT', user: user.name, eventOld: eventDb });
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
    event_model_1.default.findByIdAndDelete(id, (err, eventDeleted) => {
        if (err) {
            return res.status(500).json({ ok: false, err });
        }
        if (!eventDeleted) {
            return res.status(404).json({ ok: true, message: 'No Event has been found with the ID provided' });
        }
        res.status(200).json({ ok: true, event: eventDeleted });
        let user = req.body.user;
        broadcastEventsChange(user._id, { event: eventDeleted, method: 'PUT', user: user.name });
    });
};
