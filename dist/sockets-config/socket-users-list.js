"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SocketUsersList = void 0;
class SocketUsersList {
    constructor() {
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
        this.users.forEach((eachUser) => {
            eachUser.client.leaveAll();
        });
    }
    joinRoom(client, room) {
        let user = this.users.filter((user) => { return user.client.id === client.id; })[0];
        user.client.join(room);
    }
    leaveRoom(client, room) {
        let user = this.users.filter((user) => { return user.client.id === client.id; })[0];
        user.client.leave(room);
    }
    broadcast(userId, payload, eventName, roomId) {
        console.log({ userId });
        const user = this.users.filter((user) => { var _a; return ((_a = user.userId) === null || _a === void 0 ? void 0 : _a.toString()) === userId.toString(); })[0];
        user.client.broadcast.to(roomId).emit(eventName, payload);
    }
    //// EMIT THE EVENT TO ALL THE USERS CONNECTED ///
    emit(userId, payload, eventName) {
        const user = this.users.filter((user) => { var _a; return ((_a = user.userId) === null || _a === void 0 ? void 0 : _a.toString()) === userId.toString(); })[0];
        user.client.broadcast.emit(eventName, payload);
    }
}
exports.SocketUsersList = SocketUsersList;
