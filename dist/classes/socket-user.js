"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SocketUser = void 0;
class SocketUser {
    constructor(user, client, room = 'NO ROOM') {
        this.user = user;
        this.client = client;
        this.room = room;
    }
}
exports.SocketUser = SocketUser;
