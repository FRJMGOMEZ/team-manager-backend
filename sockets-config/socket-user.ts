import { Socket } from 'socket.io';
import { Room } from './room';

export class SocketUser{
    constructor(
        public client: Socket,
        public userId?:string,
        public room?:Room){
    }
}