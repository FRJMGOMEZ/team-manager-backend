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
exports.setNewPassword = exports.forgotPassword = void 0;
const passwordGenerator = __importStar(require("generate-password"));
const user_model_1 = __importDefault(require("../../models/user.model"));
const bcrypt = __importStar(require("bcrypt"));
const node_mail_1 = __importDefault(require("../../services/node-mail"));
exports.forgotPassword = (req, res) => {
    let email = req.params.email;
    let resetCode = passwordGenerator.generate({
        length: 10,
        numbers: true
    });
    user_model_1.default.findOneAndUpdate({ email: email }, { password: bcrypt.hashSync(resetCode, 10) })
        .exec((err, userDb) => {
        if (err) {
            return res.status(500).json({
                ok: false,
                err
            });
        }
        if (!userDb) {
            return res.status(400).json({
                ok: false,
                message: 'User not valid'
            });
        }
        if (userDb.status === false) {
            return res.status(400).json({
                ok: false,
                message: 'User is not validated'
            });
        }
        let message = `This is your reset code: ${resetCode}, just type it in the next window`;
        node_mail_1.default.to = userDb.email;
        node_mail_1.default.subject = 'Código de reseteo';
        node_mail_1.default.message = `${message} ${userDb.name}`;
        node_mail_1.default.sendMail().then(() => {
            res.status(200).json({ ok: true });
        }).catch((err) => {
            res.status(500).json({ ok: false, err });
        });
    });
};
exports.setNewPassword = (req, res) => {
    let userMail = req.params.email;
    let newPassword = req.params.newPassword;
    let resetCode = req.params.resetCode;
    user_model_1.default.findOne({ email: userMail }, (err, userDb) => {
        if (err) {
            return res.status(500).json({
                ok: false,
                err
            });
        }
        if (!userDb) {
            return res.status(400).json({
                ok: false,
                message: 'Email do not match'
            });
        }
        if (!bcrypt.compareSync(resetCode, userDb.password)) {
            return res
                .status(400)
                .json({
                ok: false,
                message: "Reset code is not valid"
            });
        }
        else {
            let message;
            if (process.env.DEMO) {
                userDb.password = bcrypt.hashSync('123', 10);
                message = `The password is 123, password changing is not allowed in Demo`;
            }
            else {
                userDb.password = bcrypt.hashSync(newPassword, 10);
                message = 'The password has been updated';
            }
            userDb.save(() => {
                if (err) {
                    return res.status(500).json({
                        ok: false,
                        err
                    });
                }
                res.status(200).json({ ok: true, message });
            });
        }
    });
};
