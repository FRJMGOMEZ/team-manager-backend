"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.joinDashboard = exports.socketUsersList = void 0;
const socket_users_list_1 = require("../socket-users-list");
const room_1 = require("../room");
exports.socketUsersList = socket_users_list_1.SocketUsersList.instance;
exports.joinDashboard = (client) => {
    client.on(`user-in-${room_1.Rooms.dashboard}`, () => {
        exports.socketUsersList.joinRoom(client, { name: room_1.Rooms.dashboard });
    });
};
