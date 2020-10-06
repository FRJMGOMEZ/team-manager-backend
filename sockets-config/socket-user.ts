import { Socket } from 'socket.io';

export class SocketUser{
    constructor(
        public client: Socket,
        public userId?:string,
        public room?:string[]){
    }
}