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
        var _a;
        (_a = this.users.find((user) => { return user.client.id === client.id; })) === null || _a === void 0 ? void 0 : _a.client.leaveAll();
        this.users = this.users.filter((user) => { return user.client.id != client.id; });
    }
    joinRoom(user, room) {
        var _a;
        user.client.join(room);
        (_a = user.rooms) === null || _a === void 0 ? void 0 : _a.push(room);
    }
    leaveRoom(user, room) {
        user.client.leave(room);
        user.rooms = user.rooms.filter((r) => { return r != room; });
    }
    getUsersInRoom(room) {
        return this.users.filter((u) => { return u.rooms.includes(room); }).map((u) => { return u.userId; });
    }
    broadcast(userId, payload, eventName, roomId) {
        const user = this.users.filter((user) => { var _a; return ((_a = user.userId) === null || _a === void 0 ? void 0 : _a.toString()) === userId.toString(); })[0];
        user.client.broadcast.to(roomId).emit(eventName, payload);
    }
    broadcastToGroup(userId, payload, eventName, group, broadcastToItself = false) {
        const user = this.users.find((user) => { var _a; return ((_a = user.userId) === null || _a === void 0 ? void 0 : _a.toString()) === userId.toString(); });
        const usersTo = this.users.filter((user) => { return user.userId && group.includes(user.userId); }).map((u) => { return u.client.id; });
        broadcastToItself && user ? user.client.emit(eventName, payload) : null;
        usersTo.forEach((clientId) => {
            user === null || user === void 0 ? void 0 : user.client.broadcast.to(clientId).emit(eventName, payload);
        });
    }
    //// EMIT THE EVENT TO ALL THE USERS CONNECTED ///
    emit(userId, payload, eventName) {
        const user = this.users.filter((user) => { var _a; return ((_a = user.userId) === null || _a === void 0 ? void 0 : _a.toString()) === userId.toString(); })[0];
        user.client.broadcast.emit(eventName, payload);
    }
    getUserByClient(client) {
        var _a;
        return (_a = this.users.find((user) => { return user.client.id === client.id; })) === null || _a === void 0 ? void 0 : _a.userId;
    }
}
exports.SocketUsersList = SocketUsersList;
//# sourceMappingURL=socket-users-list.js.map