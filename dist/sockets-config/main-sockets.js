"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.userInApp = exports.socketUsersList = void 0;
const socket_users_list_1 = require("./socket-users-list");
const socket_user_1 = require("./socket-user");
exports.socketUsersList = socket_users_list_1.SocketUsersList.instance;
exports.userInApp = (client) => {
    client.on('user-in-app', (payload) => {
        /// user db id ///
        let { userId } = payload;
        let user = new socket_user_1.SocketUser(client, userId);
        exports.socketUsersList.userInApp(user);
        client.on('user-in-project', (payload) => {
            exports.socketUsersList.joinRoom(client, payload.projectId);
        });
        client.on('user-leave-project', (payload) => {
            exports.socketUsersList.leaveRoom(client, payload.projectId);
        });
        client.on('user-in-task', (payload) => {
            exports.socketUsersList.joinRoom(client, payload.taskId);
            let roomId = payload.taskId;
            client.on('message', (payload) => {
                exports.socketUsersList.broadcast(payload.from, { message: payload.message, from: payload.from }, 'message', roomId);
            });
        });
        /// listenning user out of app ///
        client.on('user-out-app', () => {
            exports.socketUsersList.leaveApp(client);
        });
    });
};
