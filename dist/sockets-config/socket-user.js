"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SocketUser = void 0;
class SocketUser {
    constructor(client, userId, rooms = []) {
        this.client = client;
        this.userId = userId;
        this.rooms = rooms;
    }
}
exports.SocketUser = SocketUser;
