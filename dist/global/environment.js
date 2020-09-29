"use strict";
process.env.PORT = process.env.PORT || '3000';
process.env.FRONT_URL = process.env.FRONT_URL || 'http://localhost:4200';
/////////////// SEED SECRETO //////////////////////
////////Cambiar el seed a secreto en entorno heroku/////////
process.env.TOKEN_SEED = process.env.TOKEN_SEED || 'seed_desarrollo';
////////////// VENCIMIENTO DEL TOKEN //////////////
process.env.TOKEN_EXP = process.env.TOKEN_EXP || '48h';
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
////////////////  MAILJET KEYS ///////////
process.env.MAILJETUSER = 'ae4f0c92e16903546d0e3e3af4441cf1';
process.env.MAILJETPASSWORD = '20e1aef08ea2f7e92b5b2a1e849085be';
//////////// AWS S3 CREDENTIALS //////////
process.env.AWS_S3_BUCKET_NAME = 'team-manager90000';
process.env.AWS_ACCESS_KEY_ID = "AKIAQ2AXEBQ4FJOUHY4E";
process.env.AWS_SECRET_ACCESS_KEY = "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";
