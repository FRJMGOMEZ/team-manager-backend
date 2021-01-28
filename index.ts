require('./global/environment');

import Server from './server';
import bodyParser from 'body-parser';
import mongoose from 'mongoose';
import  router  from './routes/router';
import cors from 'cors';

/* Instanciamos el server */
const server = Server.instance;

/* Configuramos la codificación de la data */
server.app.use(bodyParser.urlencoded({ extended: true }));
server.app.use(bodyParser.json());

/* Configuramos el router */
const options: cors.CorsOptions = {
    allowedHeaders: ["Origin", "X-Requested-With", "Content-Type", "Accept", "Credentials", "token", "skip", "limit", "query", "Access-Control-Allow-Request-Method"],
    credentials: true,
    methods: "GET,HEAD,OPTIONS,PUT,PATCH,POST,DELETE",
    origin: process.env.FRONT_URL,
    preflightContinue: false
}

server.app.use(cors(options));

server.app.use('/', router)
/* Configuramos la base de datos */
mongoose.connection.openUri(process.env.URLDB, {
    useNewUrlParser: true
});
const db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'))
db.once('open', () => {
    console.log("DB PORT: 27017 \x1b[32m%s\x1b[0m", 'RUNNING')
})

/* Arrancamos la aplicación */
server.start(() => {
    console.log(`SERVER: ${server.port} \x1b[32m%s\x1b[0m`, ' RUNNING')
})




