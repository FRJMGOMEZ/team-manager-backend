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
exports.verifyRole = exports.verifyToken = exports.verifyStatus = void 0;
const user_model_1 = __importDefault(require("../../models/user.model"));
const jwt = __importStar(require("jsonwebtoken"));
var atob = require('atob');
/////////////// VERIFYING USER STATUS ///////////////
exports.verifyStatus = (req, res, next) => {
    let userEmail = req.body.email;
    user_model_1.default.findOne({ email: userEmail }, (err, userDb) => {
        if (err) {
            return res.status(500).json({ ok: false, err });
        }
        if (!userDb) {
            return res.status(404).json({ ok: false, message: 'CREDENTIALS ARE NOT VALID' });
        }
        if (userDb.status === true) {
            next();
            return;
        }
        else {
            return res.status(401).json({
                ok: false,
                message: `User ${userDb.name} is not granted. Talk to the admnistrator of the program to get access`
            });
        }
    });
};
/////////////// VERIFYING TOKEN ////////////////
exports.verifyToken = (req, res, next) => {
    let token = String(req.get('token'));
    jwt.verify(token, process.env.TOKEN_SEED, (err, userDecoded) => {
        if (err) {
            return res.status(401).json({
                ok: false,
                err
            });
        }
        req.body.userToken = userDecoded.userToken;
        next();
    });
};
///////////////// VERIFYING ADMIN ROLE ///////////////
exports.verifyRole = (req, res, next) => {
    if (req.body.user.role != 'ADMIN_ROLE') {
        if (req.params.id === req.body.user._id) {
            next();
            return;
        }
        return res.status(401).json({
            ok: false,
            error: 'Access forbidden for this user. Talk to the admnistrator of the program to get access'
        });
    }
    next();
};
