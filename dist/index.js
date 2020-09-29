"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require('./global/environment');
const server_1 = __importDefault(require("./server"));
const body_parser_1 = __importDefault(require("body-parser"));
const mongoose_1 = __importDefault(require("mongoose"));
const router_1 = __importDefault(require("./routes/router"));
const cors_1 = __importDefault(require("cors"));
/* Instanciamos el server */
const server = server_1.default.instance;
/* Configuramos la codificación de la data */
server.app.use(body_parser_1.default.urlencoded({ extended: true }));
server.app.use(body_parser_1.default.json());
/* Configuramos el router */
const options = {
    allowedHeaders: ["Origin", "X-Requested-With", "Content-Type", "Accept", "Credentials", "token", "query", "Access-Control-Allow-Request-Method"],
    credentials: true,
    methods: "GET,HEAD,OPTIONS,PUT,PATCH,POST,DELETE",
    origin: process.env.FRONT_URL,
    preflightContinue: false
};
server.app.use(cors_1.default(options));
server.app.use('/', router_1.default);
/* Configuramos la base de datos */
mongoose_1.default.connection.openUri(process.env.URLDB, {
    useNewUrlParser: true
});
const db = mongoose_1.default.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', () => {
    console.log("DB PORT: 27017 \x1b[32m%s\x1b[0m", 'RUNNING');
});
/* Arrancamos la aplicación */
server.start(() => {
    console.log(`SERVER: ${server.port} \x1b[32m%s\x1b[0m`, ' RUNNING');
});
