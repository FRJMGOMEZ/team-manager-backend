"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.userInApp = exports.socketUsersList = void 0;
const socket_users_list_1 = require("./socket-users-list");
const socket_user_1 = require("./socket-user");
const calendar_sockets_1 = require("./rooms/calendar-sockets");
exports.socketUsersList = socket_users_list_1.SocketUsersList.instance;
exports.userInApp = (client) => {
    client.on('user-in-app', (payload) => {
        /// user db id ///
        let { id } = payload;
        let user = new socket_user_1.SocketUser(client, id);
        /// user entry in app //
        exports.socketUsersList.userInApp(user);
        /// listenning user out of app ///
        client.on('user-out-app', () => {
            exports.socketUsersList.leaveApp(client);
        });
        /// project change ///
        //// listenning in app events ////
        calendar_sockets_1.joinCalendar(client);
    });
    client.on('leave-room', () => {
        exports.socketUsersList.leaveRoom(client);
    });
};
