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
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkToken = exports.login = void 0;
const user_model_1 = __importDefault(require("../../models/user.model"));
const bcrypt = __importStar(require("bcrypt"));
const jwt = __importStar(require("jsonwebtoken"));
var atob = require('atob');
exports.login = (req, res) => {
    let credentials = req.body;
    user_model_1.default.findOne({ email: credentials.email })
        .populate('img')
        .exec((err, userDb) => __awaiter(void 0, void 0, void 0, function* () {
        if (err) {
            return res.status(500).json({ ok: false, err });
        }
        if (!userDb) {
            return res.status(404).json({ ok: false, message: 'Credenciales no válidas' });
        }
        if (!bcrypt.compareSync(credentials.password, userDb.password)) {
            return res
                .status(400)
                .json({
                ok: false,
                message: "Credenciales no válidas"
            });
        }
        userDb.password = ':)';
        let token = yield jwt.sign({ userDb }, process.env.TOKEN_SEED, { expiresIn: process.env.TOKEN_EXP });
        res.status(200).json({
            ok: true,
            user: userDb,
            _id: userDb._id,
            token
        });
    }));
};
exports.checkToken = (req, res) => {
    let token = req.get('token');
    jwt.verify(token, process.env.TOKEN_SEED, (err, data) => __awaiter(void 0, void 0, void 0, function* () {
        if (err) {
            return res.json({ message: 'Vuelva a intentar validarse, por favor' });
        }
        if (!data) {
            return res.json({ message: 'Vuelva a intentar validarse, por favor' });
        }
        let userDb = yield data.userDb;
        let payload = yield JSON.parse(atob(token.split('.')[1]));
        verifyUpdate(payload.exp, userDb, token).then((tokenToGo) => {
            res.status(200).json({ token: tokenToGo });
        });
    }));
};
const verifyUpdate = (dateExp, userDb, token) => {
    return new Promise((resolve, reject) => __awaiter(void 0, void 0, void 0, function* () {
        let tokenExp = new Date(dateExp * 1000);
        let now = new Date();
        now = new Date(now.getFullYear(), now.getMonth(), now.getDate(), now.getHours(), now.getMinutes() + now.getTimezoneOffset());
        now.setTime(now.getTime() + 3600000 * 10);
        if (tokenExp.getTime() < now.getTime()) {
            let newtoken = yield jwt.sign({ userDb }, process.env.TOKEN_SEED, { expiresIn: process.env.TOKEN_EXP });
            resolve(newtoken);
        }
        else {
            resolve(token);
        }
    }));
};
