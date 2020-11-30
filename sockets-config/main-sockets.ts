import { Socket } from "socket.io";
import { SocketUsersList } from './socket-users-list';
import { SocketUser } from './socket-user';
export const socketUsersList = SocketUsersList.instance;
export const userInApp = (client: Socket) => {
    client.on('user-in-app', (payload: { userId:string }) => {
        /// user db id ///
        let {userId} = payload;
        let user = new SocketUser(client, userId) 
        socketUsersList.userInApp(user)

        client.on('user-in-project',(payload:{projectId:string})=>{
            socketUsersList.joinRoom(client, payload.projectId) 
        })

        client.on('user-leave-project',(payload:{projectId:string})=>{
            socketUsersList.leaveRoom(client,payload.projectId)
        })
        client.on('user-in-task',(payload:{taskId:string})=>{
            socketUsersList.joinRoom(client,payload.taskId)
            let roomId = payload.taskId;
            /* client.on('message',(payload:{message:string,from:string})=>{
              socketUsersList.broadcast(payload.from,{message:payload.message,from:payload.from},'message',roomId)
            }) */
        })
         /// listenning user out of app ///
        client.on('user-out-app', () => {
            socketUsersList.leaveApp(client)
        })
    })
}







