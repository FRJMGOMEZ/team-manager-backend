"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getMessages = exports.postMessage = void 0;
const message_model_1 = __importDefault(require("../../models/message.model"));
const task_model_1 = __importDefault(require("../../models/task.model"));
const aws_bucket_1 = require("../../services/aws-bucket");
const socket_users_list_1 = require("../../sockets-config/socket-users-list");
const awsBucket = aws_bucket_1.AwsBucket.instance;
const socketUsersList = socket_users_list_1.SocketUsersList.instance;
const broadcastMessage = (message) => {
    socketUsersList.broadcast(message.user._id.toString(), message, 'message-in', message.task._id.toString());
};
exports.postMessage = (req, res) => {
    const files = req.files;
    const body = req.body;
    const taskId = req.params.taskId;
    task_model_1.default.findById(taskId, (err, taskDb) => {
        if (err) {
            return res.status(500).json({ ok: false, err });
        }
        if (!taskDb) {
            return res.status(404).json({ ok: false, message: 'The ID introduced do not match with any task' });
        }
        const filePosts = [];
        if (files) {
            Object.keys(files).forEach((k) => {
                filePosts.push(awsBucket.recordFile(res, files[k]));
            });
        }
        Promise.all(filePosts).then((files) => {
            let newMessage = new message_model_1.default({
                user: body.userInToken._id,
                files,
                text: body.text,
                date: body.date,
                task: taskDb._id
            });
            newMessage.save((err, messageSaved) => {
                if (err) {
                    return res.status(500).json({ ok: false, err });
                }
                messageSaved
                    .populate({
                    path: 'user',
                    model: 'User',
                    select: 'name _id'
                })
                    .populate({ path: 'task', model: 'Task', select: 'project' })
                    .populate('files').execPopulate().then((messagePopulated) => {
                    broadcastMessage(messagePopulated);
                    res.status(200).json({ ok: true, message: messagePopulated });
                });
            });
        });
    });
};
exports.getMessages = (req, res) => {
    const taskId = req.params.taskId;
    const skip = Number(req.headers.skip);
    const limit = Number(req.headers.limit);
    message_model_1.default.countDocuments({ task: taskId }, (err, count) => {
        if (err) {
            console.log({ err });
            return res.status(500).json({ ok: false, err });
        }
        message_model_1.default.find({ task: taskId }).sort({ _id: -1 })
            .skip(skip)
            .limit(limit)
            .populate('user')
            .populate('files')
            .exec((err, messagesDb) => {
            if (err) {
                return res.status(500).json({ ok: false, err });
            }
            res.status(200).json({ ok: true, data: { messages: messagesDb, count } });
        });
    });
};
