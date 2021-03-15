import { Socket } from "socket.io";
import { SocketUsersList } from './socket-users-list';
import { SocketUser } from './socket-user';
import { userOffline, userOnline } from '../routes/controllers/auth-controller';
import mongoose from 'mongoose';
export const socketUsersList = SocketUsersList.instance;
export const userInApp = (client: Socket) => {
    client.on('user-in-app', (payload: { userId:string },callback) => {
        userOnline( new mongoose.Types.ObjectId(payload.userId)).then((res:any)=>{
            /// user db id ///
            let { userId } = payload;
            let user = new SocketUser(client, userId)
            socketUsersList.userInApp(user)

            client.on('user-in-project', (payload: { projectId: string }) => {
                socketUsersList.joinRoom(user, payload.projectId)
            })

            client.on('user-out-project', (payload: { projectId: string }) => {
                socketUsersList.leaveRoom(user, payload.projectId)
            })

            client.on('user-in-task', (payload: { taskId: string }, callback) => {
                socketUsersList.joinRoom(user, payload.taskId);
                let roomId = payload.taskId;
                const usersInRoom = socketUsersList.getUsersInRoom(roomId);
                callback(usersInRoom);
                socketUsersList.broadcastToRoom(user.userId as string, usersInRoom, 'users-in-task', roomId);
            })

            client.on('user-out-task', (payload: { taskId: string }) => {
                const roomId = payload.taskId;
                socketUsersList.leaveRoom(user, roomId);
                const usersInRoom = socketUsersList.getUsersInRoom(roomId);
                socketUsersList.broadcastToRoom(user.userId as string, usersInRoom, 'users-in-task', roomId);
            })
            /// listenning user out of app ///
            client.on('user-out-app', () => {
                userOffline(new mongoose.Types.ObjectId(user.userId)).then(() => {
                    socketUsersList.leaveApp(client)
                })
            })
            callback(res);
        }).catch((err)=>{
            callback(err);
        })
    })
}







