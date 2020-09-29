"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.removeMessageFromBox = exports.searchMessage = exports.saveMessage = exports.getMessagesSaved = exports.deleteMessage = exports.postMessage = exports.getFilesByProject = exports.getMessagesToCheck = exports.getMessages = void 0;
const message_model_1 = __importDefault(require("../../models/message.model"));
const mongoose_1 = __importDefault(require("mongoose"));
const user_model_1 = __importDefault(require("../../models/user.model"));
const box_model_1 = __importDefault(require("../../models/box.model"));
const project_model_1 = __importDefault(require("../../models/project.model"));
exports.getMessages = (req, res) => {
    let projectId = String(req.query.projectId);
    let from = Number(req.query.from);
    let limit = Number(req.query.limit);
    message_model_1.default.countDocuments({ project: new mongoose_1.default.Types.ObjectId(projectId) }, (err, count) => {
        if (err) {
            return res.status(500).json({ ok: false, err });
        }
        message_model_1.default.find({ project: new mongoose_1.default.Types.ObjectId(projectId) })
            .sort({ date: -1 })
            .skip(from)
            .limit(limit)
            .populate({
            path: 'user',
            model: 'User',
            select: 'user name _id'
        })
            .populate('files')
            .exec((err, messagesDb) => {
            if (err) {
                return res.status(500).json({ ok: false, err });
            }
            if (!messagesDb) {
                return res.status(404).json({ ok: false, message: 'There are no messages in the project' });
            }
            res.status(200).json({ ok: true, messages: messagesDb, count });
        });
    });
};
exports.getMessagesToCheck = (req, res) => {
    let userOnline = req.body.user.userDb;
    let requests = [];
    user_model_1.default.findById(userOnline._id, (err, userDb) => {
        if (err) {
            return res.status(500).json({ ok: false, err });
        }
        if (!userDb) {
            return res.status(404).json({ ok: false, message: 'There are no users with the ID provided' });
        }
        box_model_1.default.findById(userDb.box, (err, boxDb) => {
            if (err) {
                return res.status(500).json({ ok: false, err });
            }
            if (!boxDb) {
                return res.status(404).json({ ok: false, message: 'There are no boxes with the ID provided' });
            }
            boxDb.projects.forEach((project) => {
                requests.push(findMessages(res, project._id, project.lastConnection));
            });
            if (requests.length === 0) {
                return res.status(200).json({ ok: true, messages: [] });
            }
            else {
                Promise.all(requests).then((responses) => {
                    let messages = [];
                    responses.forEach((response) => {
                        response.forEach((message) => {
                            messages.push(message);
                        });
                    });
                    res.status(200).json({ ok: true, messages });
                });
            }
        });
    });
};
const findMessages = (res, projectId, userLastConnection) => {
    return new Promise((resolve, reject) => {
        if (userLastConnection === null) {
            resolve();
        }
        else {
            message_model_1.default.find({ project: projectId, date: { $gte: userLastConnection } })
                .populate('project', 'name _id')
                .exec((err, messages) => {
                if (err) {
                    reject(res.status(500).json({ ok: false, err }));
                }
                resolve(messages);
            });
        }
    });
};
exports.getFilesByProject = (req, res) => {
    let projectId = req.params.id;
    message_model_1.default.find({ project: new mongoose_1.default.Types.ObjectId(projectId) }).populate('files').exec((err, messagesDb) => {
        if (err) {
            return res.status(500).json({ ok: false, err });
        }
        let files = [];
        messagesDb.forEach((message) => {
            files.push(...message.files);
        });
        res.status(200).json({ ok: true, files });
    });
};
exports.postMessage = (req, res) => {
    let message = new message_model_1.default({
        user: req.body.user.userDb._id,
        project: req.body.project,
        text: req.body.text,
        files: req.body.files,
        date: new Date().getTime()
    });
    message.save((err) => {
        if (err) {
            return res.status(500).json({ ok: false, err });
        }
        message.populate({
            path: 'user',
            model: 'User',
            select: 'name email _id'
        }).populate({ path: 'files' }, (err, messageDb) => {
            if (err) {
                return res.status(500).json({ ok: false, err });
            }
            project_model_1.default.findByIdAndUpdate(message.project, { $push: { messages: messageDb._id } })
                .exec((err, projectDb) => {
                if (err) {
                    return res.status(500).json({ ok: false, err });
                }
                if (!projectDb) {
                    res.status(404).json({ ok: false, message: 'There are no projects with the ID provided' });
                }
                res.status(200).json({ ok: true, message: messageDb });
            });
        });
    });
};
exports.deleteMessage = (req, res) => {
    let id = req.params.id;
    message_model_1.default.findByIdAndDelete(id).exec((err, messageDeleted) => {
        if (err) {
            return res.status(500).json({ ok: false, err });
        }
        if (!messageDeleted) {
            return res.status(404).json({ ok: false, message: 'There are no messages with the ID provided' });
        }
        project_model_1.default.updateOne({ messages: messageDeleted._id }, { $pull: { messages: messageDeleted._id } }, { new: true }, (err, projectUpdated) => {
            if (err) {
                return res.status(500).json({
                    ok: false,
                    err
                });
            }
            if (!projectUpdated) {
                return res.status(404).json({ ok: false, message: 'There are no projects with the message provided' });
            }
            res.status(200).json({ ok: true, message: messageDeleted });
        });
    });
};
exports.getMessagesSaved = (req, res) => {
    let userOnline = req.body.user.userDb;
    let projectId = req.query.projectId;
    box_model_1.default.findById(userOnline.box)
        .populate({
        path: 'messages',
        model: 'Message',
        match: {
            project: projectId
        },
        populate: [
            { path: 'files', model: 'FileModel' },
            { path: 'user', model: 'User' }
        ]
    })
        .exec((err, boxDb) => {
        if (err) {
            return res.status(500).json({ ok: false, err });
        }
        if (!boxDb) {
            return res.status(404).json({ ok: false, message: 'There are no boxes with the ID provided' });
        }
        let messages = boxDb.messages;
        res.status(200).json({ ok: true, messages });
    });
};
exports.saveMessage = (req, res) => {
    let userOnline = req.body.user.userDb;
    let messageId = req.params.id;
    box_model_1.default.findByIdAndUpdate(userOnline.box, { $push: { messages: new mongoose_1.default.Types.ObjectId(messageId) } })
        .exec((err, boxSaved) => {
        if (err) {
            return res.status(500).json({ ok: false, err });
        }
        if (!boxSaved) {
            return res.status(404).json({ ok: false, message: 'There are no boxes with the ID provided' });
        }
        res.status(200).json({ ok: true });
    });
};
exports.searchMessage = (req, res) => {
    let input = req.params.input;
    let projectId = req.query.projectId;
    let userOnline = req.body.user.userDb;
    let regExp = new RegExp(input, "i");
    box_model_1.default.findById(userOnline.box).populate({
        path: 'messages',
        model: 'Message',
        match: {
            text: regExp,
            project: projectId
        },
        populate: [
            { path: 'files', model: 'FileModel' },
            { path: 'user', model: 'User' }
        ]
    }).exec((err, boxDb) => {
        if (err) {
            return res.status(500).json({ ok: false, err });
        }
        if (!boxDb) {
            return res.json(404).json({ ok: false, message: 'No boxes have been found' });
        }
        let regExpHTML = /<([a-z0-6]+)([^<]+)*(?:>(.*)<\/\1>|\s+\/>)/;
        let messages = boxDb.messages.map((message) => {
            message.text = message.text.split('&nbsp').join('');
            return message.text.match(regExpHTML);
        });
        res.status(200).json({ ok: true, messages });
    });
};
exports.removeMessageFromBox = (req, res) => {
    let userOnline = req.body.user.userDb;
    let messageId = req.params.id;
    box_model_1.default.findByIdAndUpdate(userOnline.box, { $pull: { "messages": messageId } }, (err) => {
        if (err) {
            return res.status(500).json({ ok: false, err });
        }
        res.status(200).json({ ok: true });
    });
};
