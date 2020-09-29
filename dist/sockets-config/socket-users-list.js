"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SocketUsersList = void 0;
class SocketUsersList {
    constructor() {
        this.eventNames = {
            "events-changes": {
                rooms: ['calendar', 'dashboard']
            }
        };
        this.users = [];
    }
    static get instance() {
        return this._instance || (this._instance = new this());
    }
    userInApp(user) {
        this.users.push(user);
    }
    leaveApp(client) {
        this.users = this.users.filter((user) => { return user.client.id != client.id; });
    }
    joinRoom(client, room, broadcast) {
        let user = this.users.filter((user) => { return user.client.id === client.id; })[0];
        if (user.room) {
            client.leave(`${room.name}:${room.id}`);
        }
        user.room = room;
        console.log({ room });
        client.join(`${room.name}:${room.id}`);
        if (broadcast) {
            client.broadcast.in(`${room.name}:${room.id}`).emit(`user-in-calendar-${room}`);
        }
    }
    leaveRoom(client) {
        let user = this.users.filter((user) => { return user.client.id === client.id; })[0];
        let room = user.room;
        client.leave(`${room === null || room === void 0 ? void 0 : room.name}:${room === null || room === void 0 ? void 0 : room.id}`);
        user.room = undefined;
    }
    //// EMIT THE EVENT TO THE USER WHERE THE USERONLINE IS ////
    broadcast(userId, payload, eventName) {
        var _a, _b, _c;
        let user = this.users.filter((user) => { return user.userId === userId; })[0];
        user.client.broadcast.in(`${(_a = user.room) === null || _a === void 0 ? void 0 : _a.name}${((_b = user.room) === null || _b === void 0 ? void 0 : _b.id) ? ':' : ''}${(_c = user.room) === null || _c === void 0 ? void 0 : _c.id}`).emit(eventName, payload);
    }
    //// EMIT THE EVENT TO ALL THE USERS CONNECTED ///
    emit(userId, payload, eventName) {
        let user = this.users.filter((user) => { var _a; return ((_a = user.userId) === null || _a === void 0 ? void 0 : _a.toString()) === userId.toString(); })[0];
        user.client.broadcast.emit(eventName, payload);
    }
}
exports.SocketUsersList = SocketUsersList;
