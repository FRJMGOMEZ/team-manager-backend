"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.userOut = exports.configUser = exports.disconnect = exports.connectClient = exports.socketUsersList = void 0;
const socket_users_list_1 = require("../classes/socket-users-list");
const socket_user_1 = require("../classes/socket-user");
exports.socketUsersList = socket_users_list_1.SocketUsersList.instance;
exports.connectClient = (client) => {
    const newUser = new socket_user_1.SocketUser(client.id);
    exports.socketUsersList.addUser(newUser);
};
exports.disconnect = (client) => {
    client.on('disconnect', () => {
        exports.socketUsersList.removeUserById(client.id).then((user) => {
            client.broadcast.emit('user-out', user);
        });
    });
};
exports.configUser = (client) => {
    client.on('config-user', (payload, callback) => {
        console.log({ payload });
        exports.socketUsersList.updateName(client.id, payload.name).then(({ users, user }) => {
            callback({
                ok: true,
                user,
                users
            });
            client.broadcast.emit('new-user', user);
        });
    });
};
exports.userOut = (client) => {
    client.on('logout', (payload, callback) => {
        exports.socketUsersList.updateName(client.id, 'NO-NAME').then(({ users, user }) => {
            client.broadcast.emit('user-out', user);
            callback();
        });
    });
};
