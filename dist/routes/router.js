"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.router = void 0;
const express_1 = require("express");
const auth_controller_1 = require("./controllers/auth-controller");
const users_controller_1 = require("./controllers/users-controller");
const auth_1 = require("./middlewares/auth");
const express_fileupload_1 = __importDefault(require("express-fileupload"));
const files_controller_1 = require("./controllers/files-controller");
const projects_controller_1 = require("./controllers/projects-controller");
const demo_1 = require("./middlewares/demo");
const chat_controller_1 = require("./controllers/chat-controller");
const password_controller_1 = require("./controllers/password.controller");
const event_controller_1 = require("./controllers/event-controller");
const notification_controller_1 = require("./controllers/notification-controller");
exports.router = express_1.Router();
exports.router.use(express_fileupload_1.default());
//// AUTH  ///
exports.router.post('/login', auth_1.verifyStatus, auth_controller_1.login);
exports.router.post('/user', users_controller_1.postUser);
exports.router.get('/check-token', auth_controller_1.checkToken);
exports.router.get('/refresh-token', auth_controller_1.refreshToken);
exports.router.get('/users', [auth_1.verifyToken], users_controller_1.getUsers);
exports.router.get('/files/:type/:fileName', files_controller_1.getBackFile);
exports.router.get('/get-aws-file/:name', files_controller_1.getAwsFile);
exports.router.put('/upload-file/:download', files_controller_1.postFile);
exports.router.delete('/delete-file/:fileId', files_controller_1.removeFile);
//// PROJECTS ////
exports.router.get('/projects', auth_1.verifyToken, projects_controller_1.getProjects);
exports.router.get('/project/:id', auth_1.verifyToken, projects_controller_1.getProjectById);
exports.router.post('/project', [auth_1.verifyToken], projects_controller_1.postProject);
exports.router.put('/project', [auth_1.verifyToken], projects_controller_1.putProject);
exports.router.delete('/project/:id', [demo_1.checkDemo, auth_1.verifyToken], projects_controller_1.deleteProject);
exports.router.get('/getParticipants/:id', auth_1.verifyToken, projects_controller_1.getParticipants);
///// NOTIFICATIONS /////
exports.router.patch('/notification/:id', auth_1.verifyToken, notification_controller_1.toggleNotification);
exports.router.get('/notifications/:userId', auth_1.verifyToken, notification_controller_1.getNotifications);
exports.router.get('/messages', auth_1.verifyToken, chat_controller_1.getMessages);
exports.router.get('/messages-to-check', auth_1.verifyToken, chat_controller_1.getMessagesToCheck);
exports.router.get('/project-files/:id', auth_1.verifyToken, chat_controller_1.getFilesByProject);
exports.router.post('/message', auth_1.verifyToken, chat_controller_1.postMessage);
exports.router.delete('/message/:id', auth_1.verifyToken, chat_controller_1.deleteMessage);
exports.router.get('/messages-saved', auth_1.verifyToken, chat_controller_1.getMessagesSaved);
exports.router.put('/save-message/:id', auth_1.verifyToken, chat_controller_1.saveMessage);
exports.router.get('/search-message/:input', auth_1.verifyToken, chat_controller_1.searchMessage);
exports.router.put('/remove-message/:id', auth_1.verifyToken, chat_controller_1.removeMessageFromBox);
exports.router.put('/forgotPassword/:email', password_controller_1.forgotPassword);
exports.router.put('/setNewPassword/:email/:resetCode/:newPassword', password_controller_1.setNewPassword);
///// EVENTS /////
exports.router.post('/event', [auth_1.verifyToken], event_controller_1.postEvent);
exports.router.get('/events-by-time-range/:selector', [auth_1.verifyToken], event_controller_1.getEventsByTimeRange);
exports.router.get('/event-by-id/:id', auth_1.verifyToken, event_controller_1.getEventById);
exports.router.patch('/event/:id', [auth_1.verifyToken], event_controller_1.putEvent);
exports.router.delete('/event/:id', [auth_1.verifyToken], event_controller_1.deleteEvent);
exports.default = exports.router;
