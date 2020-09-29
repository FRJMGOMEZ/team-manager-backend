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
exports.getUsers = exports.postUser = void 0;
const box_model_1 = __importDefault(require("../../models/box.model"));
const user_model_1 = __importDefault(require("../../models/user.model"));
const bcrypt = __importStar(require("bcrypt"));
exports.postUser = (req, res) => {
    let body = req.body;
    let newBox = new box_model_1.default({
        projects: [],
        messages: [],
        events: []
    });
    newBox.save((err, boxSaved) => {
        if (err) {
            return res.status(500).json({
                ok: false,
                err
            });
        }
        let user = new user_model_1.default({
            name: body.name,
            email: body.email,
            password: bcrypt.hashSync(body.password, 10),
            status: false,
            box: boxSaved._id
        });
        user.save((err, userSaved) => {
            if (err) {
                return res.status(500).json({
                    ok: false,
                    err
                });
            }
            res.status(200).json({
                ok: true,
                message: 'Usuario creado y a la espera de habilitación por parte del admnistrador del programa',
            });
        });
    });
};
exports.getUsers = (req, res) => {
    let from = Number(req.query.from) || 0;
    let limit = Number(req.query.limit) || 5;
    user_model_1.default.find()
        .skip(from)
        .limit(limit)
        .populate('projects', 'name _id description img')
        .populate('img')
        .exec((err, usersDb) => {
        if (err) {
            console.log({ err });
            return res.status(500).json({
                ok: false,
                err
            });
        }
        if (!usersDb) {
            return res.status(404).json({
                ok: false,
                message: 'There are no user in DB'
            });
        }
        user_model_1.default.countDocuments({ $nor: [{ _id: req.body.user._id }] }, (err, count) => {
            if (err) {
                return res.status(500).json({
                    ok: false,
                    err
                });
            }
            if (process.env.DEMO) {
                usersDb = usersDb.filter((user) => { return user.email != 'frjmartinezgomez@gmail.com'; });
            }
            res.status(200).json({
                ok: true,
                users: usersDb,
                count
            });
        });
    });
};
