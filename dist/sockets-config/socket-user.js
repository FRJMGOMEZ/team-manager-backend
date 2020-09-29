"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SocketUser = void 0;
class SocketUser {
    constructor(client, userId, room) {
        this.client = client;
        this.userId = userId;
        this.room = room;
    }
}
exports.SocketUser = SocketUser;
