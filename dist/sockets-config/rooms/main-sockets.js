"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.disconnect = exports.userOffline = exports.userOnline = exports.socketUsersList = void 0;
const socket_users_list_1 = require("../socket-users-list");
const socket_user_1 = require("../socket-user");
const mongoose_1 = __importDefault(require("mongoose"));
exports.socketUsersList = socket_users_list_1.SocketUsersList.instance;
exports.userOnline = (client) => {
    client.on('user-in-app', (payload) => {
        let user = new socket_user_1.SocketUser(client.id, new mongoose_1.default.Schema.Types.ObjectId(payload.userId));
        exports.socketUsersList.userInApp(user);
    });
};
exports.userOffline = (client) => {
    client.on('user-out-app', () => {
        exports.socketUsersList.leave(client);
    });
};
exports.disconnect = (client) => {
    client.on('disconnect', () => {
        exports.socketUsersList.leave(client);
    });
};
