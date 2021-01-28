
import { Request, Response } from 'express';
import * as passwordGenerator from 'generate-password';
import User from '../../models/user.model';
import * as bcrypt from 'bcrypt';
import { IUser } from '../../models/user.model';
import Mail from  '../../services/node-mail';

export const forgotPassword = (req:Request, res:Response)=>{
    let email = req.params.email;
    let resetCode = passwordGenerator.generate({
        length: 10,
        numbers: true
    });
    User.findOneAndUpdate({ email: email }, { password: bcrypt.hashSync(resetCode, 10) })
        .exec((err, userDb:IUser) => {
            if (err) {
                return res.status(500).json({
                    ok: false,
                    err
                })
            }
            if (!userDb) {
                return res.status(400).json({
                    ok: false,
                    message: 'User not valid'
                })
            }
            if (userDb.status === false) {
                return res.status(400).json({
                    ok: false,
                    message: 'User is not validated'
                })
            }
            let message = `This is your reset code: ${resetCode}, just type it in the next window`
            Mail.to = userDb.email;
            Mail.subject = 'Código de reseteo';
            Mail.message = `${message} ${userDb.name}`
            Mail.sendMail().then(()=>{
                res.status(200).json({ok:true})

            }).catch((err)=>{
                res.status(500).json({ok:false,err})
            })
        })  
}


export const setNewPassword = (req: Request, res: Response)=>{
    let userMail = req.params.email;
    let newPassword = req.params.newPassword;
    let resetCode = req.params.resetCode;
    User.findOne({ email: userMail }, (err, userDb) => {
        if (err) {
            return res.status(500).json({
                ok: false,
                err
            })
        }
        if (!userDb) {
            return res.status(400).json({
                ok: false,
                message: 'Email do not match'
            })
        }
        if (!bcrypt.compareSync(resetCode, userDb.password)) {
            return res
                .status(400)
                .json({
                    ok: false,
                    message: "Reset code is not valid"
                });
        } else {
            let message:string;
            if (process.env.DEMO) {
                userDb.password = bcrypt.hashSync('123', 10)
                message = `The password is 123, password changing is not allowed in Demo`
            } else {
                userDb.password = bcrypt.hashSync(newPassword, 10);
                message = 'The password has been updated'
            }
            userDb.save(() => {
                if (err) {
                    return res.status(500).json({
                        ok: false,
                        err
                    })
                }
                res.status(200).json({ ok: true, message })
            })
        }
    })
}


