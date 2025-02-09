import express from 'express';
import socketIO from 'socket.io';
import http from 'http';
import * as mainSockets from './sockets-config/main-sockets'
import { AwsBucket } from './services/aws-bucket';
import { userOffline } from './routes/controllers/auth-controller';
import mongoose from 'mongoose';
import { SocketUsersList } from './sockets-config/socket-users-list';

const socketUsersList = SocketUsersList.instance;

export default class Server {

    public static _instance: Server;

    public app: express.Application;

    public port: string;

    public io: socketIO.Server

    private httpServer: http.Server

    public awsBucket : AwsBucket

    /* CON EL CONSTRUCTOR PRIVADO Y LA LÓGICA DEL GETTER INSTANCE CONSEGUIMOS RESTRINGIR EL INSTANCIAMIENTO DE LA CLASE A UNA INSTANCIA, PARA NO ABRIR MÁS DE UN FLUJO DE SOCKETS */
    private constructor() {

        this.awsBucket = AwsBucket.instance;

        this.app = express();

        this.port = process.env.PORT;

        this.httpServer = new http.Server(this.app);

        this.io = socketIO(this.httpServer);

        this.listenningSockets();

    }


    public static get instance() {

        return this._instance || (this._instance = new this())

    }

    private listenningSockets() {
        this.io.on('connection', client => {
            mainSockets.userInApp(client);
            client.on('disconnect', () => {
                const userId = socketUsersList.getUserByClient(client);
                userOffline( new mongoose.Types.ObjectId(userId)).then(()=>{
                    socketUsersList.leaveApp(client)
                })
            })
        })
    }

    start(callback: any) {
        this.httpServer.listen(this.port, callback);
    }

}