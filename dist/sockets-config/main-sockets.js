"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.userInApp = exports.socketUsersList = void 0;
const socket_users_list_1 = require("./socket-users-list");
const socket_user_1 = require("./socket-user");
const auth_controller_1 = require("../routes/controllers/auth-controller");
const mongoose_1 = __importDefault(require("mongoose"));
exports.socketUsersList = socket_users_list_1.SocketUsersList.instance;
exports.userInApp = (client) => {
    client.on('user-in-app', (payload, callback) => {
        auth_controller_1.userOnline(new mongoose_1.default.Types.ObjectId(payload.userId)).then((res) => {
            /// user db id ///
            let { userId } = payload;
            let user = new socket_user_1.SocketUser(client, userId);
            exports.socketUsersList.userInApp(user);
            client.on('user-in-project', (payload) => {
                exports.socketUsersList.joinRoom(user, payload.projectId);
            });
            client.on('user-out-project', (payload) => {
                exports.socketUsersList.leaveRoom(user, payload.projectId);
            });
            client.on('user-in-task', (payload, callback) => {
                exports.socketUsersList.joinRoom(user, payload.taskId);
                let roomId = payload.taskId;
                const usersInRoom = exports.socketUsersList.getUsersInRoom(roomId);
                callback(usersInRoom);
                exports.socketUsersList.broadcast(user.userId, usersInRoom, 'users-in-task', roomId);
            });
            client.on('user-out-task', (payload) => {
                const roomId = payload.taskId;
                exports.socketUsersList.leaveRoom(user, roomId);
                const usersInRoom = exports.socketUsersList.getUsersInRoom(roomId);
                exports.socketUsersList.broadcast(user.userId, usersInRoom, 'users-in-task', roomId);
            });
            /// listenning user out of app ///
            client.on('user-out-app', () => {
                auth_controller_1.userOffline(new mongoose_1.default.Types.ObjectId(user.userId)).then(() => {
                    exports.socketUsersList.leaveApp(client);
                });
            });
            callback(res);
        }).catch((err) => {
            callback(err);
        });
    });
};
