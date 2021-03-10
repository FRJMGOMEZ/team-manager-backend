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
    origin: "https://frjmgomez.github.io/bee-team",
    preflightContinue: false
}
/* const allowedOrigins = ["http://localhost:4200", ]; */

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


/* 
mongodb+srv://frjmartinezgomez:Gondorgenwein123!@cluster0.v9kxn.mongodb.net/BEE-TEAM?retryWrites=true&w=majority
mongodb+srv://frjmgomez:Billyshears123@cluster0.enl0p.mongodb.net/CARGOM-MUSIC-ADM?retryWrites=true&w=majority
*/


