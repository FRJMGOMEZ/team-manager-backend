"use strict";
process.env.PORT = process.env.PORT || '3000';
process.env.FRONT_URL = process.env.FRONT_URL || 'http://localhost:4200';
/////////////// SEED SECRETO //////////////////////
////////Cambiar el seed a secreto en entorno heroku/////////
process.env.TOKEN_SEED = process.env.TOKEN_SEED || 'seed_desarrollo';
////////////// VENCIMIENTO DEL TOKEN //////////////
process.env.TOKEN_EXP = process.env.TOKEN_EXP || '2h';
/////////////// ENVIRONMENT /////////////
process.env.NODE_ENV = process.env.NODE_ENV || 'developing';
/////////////// BASE DE DATOS /////////////
let urlDataBase;
if (process.env.NODE_ENV === 'developing') {
    urlDataBase = 'mongodb://localhost:27017/team-manager';
}
else {
    urlDataBase = `mongodb://${process.env.MONGO_URI}/cargodbtest`;
}
;
process.env.URLDB = urlDataBase;
if (process.env.NODE_ENV === 'developing') {
    require('./aws');
    require('./mailjet');
}
