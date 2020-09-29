"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.newTask = exports.editMessage = exports.removeMessage = exports.newMessage = exports.joinSingleProject = exports.joinProjects = exports.socketUsersList = void 0;
const socket_users_list_1 = require("../socket-users-list");
const room_1 = require("../room");
const server_1 = __importDefault(require("../../server"));
exports.socketUsersList = socket_users_list_1.SocketUsersList.instance;
exports.joinProjects = (client) => {
    client.on(`user-in-${room_1.Rooms.projects}`, () => {
        exports.socketUsersList.joinRoom(client, { name: room_1.Rooms.projects });
    });
};
exports.joinSingleProject = (client) => {
    client.on(`user-in-single-project`, (payload) => {
        exports.socketUsersList.joinRoom(client, { name: room_1.Rooms.projects, id: payload.projectId });
    });
};
exports.newMessage = (projectId, message) => {
    const server = server_1.default.instance;
    server.io.in(projectId).emit('new-message', message);
};
exports.removeMessage = (projectId, messageId) => {
    const server = server_1.default.instance;
    server.io.in(projectId).emit('remove-message', messageId);
};
exports.editMessage = (projectId, message) => {
    const server = server_1.default.instance;
    server.io.in(projectId).emit('edit-message', message);
};
exports.newTask = (projectId, task) => {
    const server = server_1.default.instance;
    server.io.in(projectId).emit('new-task', task);
};
