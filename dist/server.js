"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const socket_io_1 = __importDefault(require("socket.io"));
const http_1 = __importDefault(require("http"));
const mainSockets = __importStar(require("./sockets-config/main-sockets"));
const main_sockets_1 = require("./sockets-config/main-sockets");
const aws_bucket_1 = require("./services/aws-bucket");
class Server {
    /* CON EL CONSTRUCTOR PRIVADO Y LA LÓGICA DEL GETTER INSTANCE CONSEGUIMOS RESTRINGIR EL INSTANCIAMIENTO DE LA CLASE A UNA INSTANCIA, PARA NO ABRIR MÁS DE UN FLUJO DE SOCKETS */
    constructor() {
        this.awsBucket = aws_bucket_1.AwsBucket.instance;
        this.app = express_1.default();
        this.port = process.env.PORT;
        this.httpServer = new http_1.default.Server(this.app);
        this.io = socket_io_1.default(this.httpServer);
        this.listenningSockets();
    }
    static get instance() {
        return this._instance || (this._instance = new this());
    }
    listenningSockets() {
        this.io.on('connection', client => {
            mainSockets.userInApp(client);
            client.on('disconnect', () => {
                main_sockets_1.socketUsersList.leaveApp(client);
            });
        });
    }
    start(callback) {
        this.httpServer.listen(this.port, callback);
    }
}
exports.default = Server;
