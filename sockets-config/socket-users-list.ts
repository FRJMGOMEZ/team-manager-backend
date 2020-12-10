import { SocketUser } from './socket-user';
import { Socket } from "socket.io";
import { userInApp } from './main-sockets';
import User from '../models/user.model';

export class SocketUsersList{
    public static _instance: SocketUsersList;

    private users:SocketUser[] = [];

    constructor(){}

    public static get instance() {
        return this._instance || (this._instance = new this())
    }

    userInApp(user:SocketUser){
        this.users.push(user);
    }
    leaveApp(client: Socket) {
        this.users.find((user:SocketUser)=>{ return user.client.id === client.id})?.client.leaveAll()
        this.users = this.users.filter((user: SocketUser) => { return user.client.id != client.id })
    }
    joinRoom(user:SocketUser,room:string){
        user.client.join(room)
        user.rooms?.push(room);  
    }
    leaveRoom(user: SocketUser,room:string){
        user.client.leave(room) 
        user.rooms = user.rooms.filter((r:string)=>{ return r != room })
    }
    getUsersInRoom(room: string) {
        console.log(this.users)
        return this.users.filter((u: SocketUser) => { return u.rooms.includes(room) }).map((u:SocketUser)=>{ return u.userId})
    }
    broadcast(userId:string, payload:any,eventName:string, roomId:string){
        const user = this.users.filter((user) => { return user.userId?.toString() === userId.toString() })[0];
        user.client.broadcast.to(roomId).emit(eventName,payload) 
    }
    
    //// EMIT THE EVENT TO ALL THE USERS CONNECTED ///
    emit(userId: string, payload: any, eventName: string){
        const user = this.users.filter((user) => { return user.userId?.toString() === userId.toString() })[0];
        user.client.broadcast.emit(eventName,payload);
    }
}