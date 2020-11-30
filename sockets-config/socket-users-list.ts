import { SocketUser } from './socket-user';
import { Socket } from "socket.io";
import { userInApp } from './main-sockets';

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
        this.users = this.users.filter((user: SocketUser) => { return user.client.id != client.id })
        this.users.forEach((eachUser:SocketUser)=>{
            eachUser.client.leaveAll()
        })
    }
    
    joinRoom(client:Socket,room:string){
        let user:SocketUser = this.users.filter((user: SocketUser) => {return user.client.id === client.id })[0];
        user.client.join(room)
        
    }
    leaveRoom(client:Socket,room:string){
        let user: SocketUser = this.users.filter((user: SocketUser) => { return user.client.id === client.id })[0];
        user.client.leave(room) 
    }
    broadcast(userId:string, payload:any,eventName:string, roomId:string){
        console.log({userId})
        const user = this.users.filter((user) => { return user.userId?.toString() === userId.toString() })[0];
        user.client.broadcast.to(roomId).emit(eventName,payload) 
    }
    
    //// EMIT THE EVENT TO ALL THE USERS CONNECTED ///
    emit(userId: string, payload: any, eventName: string){
        const user = this.users.filter((user) => { return user.userId?.toString() === userId.toString() })[0];
        user.client.broadcast.emit(eventName,payload);
    }
}