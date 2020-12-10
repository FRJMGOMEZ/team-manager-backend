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
            socketUsersList.joinRoom(user, payload.projectId) 
        })

        client.on('user-leave-project',(payload:{projectId:string})=>{
            socketUsersList.leaveRoom(user,payload.projectId)
        })
        client.on('user-in-task',(payload:{taskId:string},callback)=>{

            socketUsersList.joinRoom(user,payload.taskId);
            let roomId = payload.taskId;
            const usersInRoom = socketUsersList.getUsersInRoom(roomId); 
            callback(usersInRoom);
            socketUsersList.broadcast(user.userId as string,usersInRoom,'users-in-task',roomId);
            
            client.on('user-out-task',()=>{
                socketUsersList.leaveRoom(user,roomId);
                const usersInRoom = socketUsersList.getUsersInRoom(roomId); 
                socketUsersList.broadcast(user.userId as string, usersInRoom, 'users-in-task', roomId);
            })
        })
         /// listenning user out of app ///
        client.on('user-out-app', () => {
            socketUsersList.leaveApp(client)
        })
    })
}







