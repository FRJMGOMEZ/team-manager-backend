import { Socket } from "socket.io";
import { SocketUsersList } from './socket-users-list';
import { SocketUser } from './socket-user';
import { joinCalendar } from './rooms/calendar-sockets';

export const socketUsersList = SocketUsersList.instance;


export const userInApp = (client: Socket) => {
    client.on('user-in-app', (payload: { id: string }) => {

        /// user db id ///
        let {id} = payload;
        let user = new SocketUser(client, id)

        /// user entry in app //
        socketUsersList.userInApp(user)

        /// listenning user out of app ///
        client.on('user-out-app', () => {
            socketUsersList.leaveApp(client)
        })

        /// project change ///

        //// listenning in app events ////
        joinCalendar(client)
    })

    client.on('leave-room',()=>{
        socketUsersList.leaveRoom(client)
    })
}







