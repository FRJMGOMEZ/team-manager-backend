"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.disconnect = exports.userOffline = exports.userOnline = exports.socketUsersList = void 0;
const socket_users_list_1 = require("./socket-users-list");
const socket_user_1 = require("./socket-user");
const mongoose_1 = __importDefault(require("mongoose"));
const room_1 = require("./room");
exports.socketUsersList = socket_users_list_1.SocketUsersList.instance;
exports.userOnline = (client) => {
    client.on('user-in-app', (payload, callback) => {
        let user = new socket_user_1.SocketUser(client.id, new mongoose_1.default.Schema.Types.ObjectId(payload.userId), { room: room_1.Rooms.Dashboard });
        exports.socketUsersList.addUser(user);
    });
};
exports.userOffline = (client) => {
    client.on('user-out', (payload, callback) => {
        exports.socketUsersList.removeUserById(client.id).then((user) => {
            client.broadcast.emit('user-out', user);
        });
    });
};
exports.disconnect = (client) => {
    client.on('disconnect', () => {
        exports.socketUsersList.removeUserById(client.id).then((user) => {
            client.broadcast.emit('user-out', user);
        });
    });
};
