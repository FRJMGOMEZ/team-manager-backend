import {Request, Response, NextFunction } from 'express';
import User, { IUser } from '../../models/user.model';
import * as jwt from 'jsonwebtoken';


/////////////// VERIFYING USER STATUS ///////////////
export const verifyStatus = (req:Request, res:Response, next:NextFunction) => {
    let userEmail = req.body.email;
    User.findOne({ email: userEmail }, (err:Error, userDb:IUser) => {
        if (err) {
            return res.status(500).json({ ok: false, err })
        }
        if (!userDb) {
            return res.status(404).json({ ok: false, message: 'No se han encontrado usuarios con las credenciales aportadas' })
        }
        if (userDb.status === true) {
            req.body.user = userDb;
            next()
            return
        } else {
            return res.status(401).json({
                ok: false,
                message: `User ${userDb.name} is not granted. Talk to the admnistrator of the program to get access`
            })
        }
    })
}


/////////////// VERIFYING TOKEN ////////////////

export const verifyToken = (req:Request, res:Response, next:NextFunction) => {
    let token = String(req.get('token'));
    jwt.verify(token, process.env.TOKEN_SEED, (err:any, userDecoded:any) => {
        if (err) {
            return res.status(401).json({
                ok: false,
                err
            })
        }
        req.body.user = userDecoded.userDb;
        next()
    })
}


///////////////// VERIFYING ADMIN ROLE ///////////////

export const verifyRole = (req: Request, res: Response, next: NextFunction) => {
    if (req.body.user.role != 'ADMIN_ROLE') {
        if (req.params.id === req.body.user._id) {
            next();
            return
        }
        return res.status(401).json({
            ok: false,
            error: 'Access forbidden for this user. Talk to the admnistrator of the program to get access'
        })
    }
    next()
}