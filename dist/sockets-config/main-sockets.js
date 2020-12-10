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
            exports.socketUsersList.joinRoom(user, payload.projectId);
        });
        client.on('user-leave-project', (payload) => {
            exports.socketUsersList.leaveRoom(user, payload.projectId);
        });
        client.on('user-in-task', (payload, callback) => {
            exports.socketUsersList.joinRoom(user, payload.taskId);
            let roomId = payload.taskId;
            const usersInRoom = exports.socketUsersList.getUsersInRoom(roomId);
            callback(usersInRoom);
            exports.socketUsersList.broadcast(user.userId, usersInRoom, 'users-in-task', roomId);
            client.on('user-out-task', () => {
                exports.socketUsersList.leaveRoom(user, roomId);
                const usersInRoom = exports.socketUsersList.getUsersInRoom(roomId);
                exports.socketUsersList.broadcast(user.userId, usersInRoom, 'users-in-task', roomId);
            });
        });
        /// listenning user out of app ///
        client.on('user-out-app', () => {
            exports.socketUsersList.leaveApp(client);
        });
    });
};
