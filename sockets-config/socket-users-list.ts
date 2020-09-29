import { SocketUser } from './socket-user';
import { Socket } from "socket.io";
import { Room } from './room';
export class SocketUsersList{
    eventNames:any = {
        "events-changes":{
            rooms:['calendar','dashboard']
        }
    }
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
        
        this.users = this.users.filter((user: SocketUser) => { return user.client.id != client.id })
    }

    joinRoom(client:Socket,room:Room,broadcast:boolean){
        let user:SocketUser = this.users.filter((user: SocketUser) => { return user.client.id === client.id })[0];
        if(user.room){
            client.leave(`${room.name}:${room.id}`)
        }
        user.room= room;
        console.log({room})
        client.join(`${room.name}:${room.id}`);
        if(broadcast){
            client.broadcast.in(`${room.name}:${room.id}`).emit(`user-in-calendar-${room}`)
        }
    }

    leaveRoom(client:Socket){
        let user: SocketUser = this.users.filter((user: SocketUser) => { return user.client.id === client.id })[0];
        let room = user.room;
        client.leave(`${room?.name}:${room?.id}`)
        user.room = undefined;
    }

    //// EMIT THE EVENT TO THE USER WHERE THE USERONLINE IS ////
    broadcast(userId:string, payload:any,eventName:string){
        let user = this.users.filter((user)=>{ return user.userId === userId})[0];
        user.client.broadcast.in(`${user.room?.name}${user.room?.id ? ':' : ''}${user.room?.id}`).emit(eventName, payload)  
    }

    //// EMIT THE EVENT TO ALL THE USERS CONNECTED ///
    emit(userId: string, payload: any, eventName: string){
        let user = this.users.filter((user) => { return user.userId?.toString() === userId.toString() })[0];
        user.client.broadcast.emit(eventName,payload);
    }
}