
import User from '../../models/user.model';
import * as bcrypt from 'bcrypt';
import { IUser } from '../../models/user.model';
import { Request, Response } from 'express';
export const postUser = (req: Request, res: Response) => {
    let body = req.body;

    let user = new User({
        name: body.name,
        email: body.email,
        password: bcrypt.hashSync(body.password, 10),
        status: false,
        projects: []
    })
    user.save((err: Error, userSaved: IUser) => {
        if (err) {
            return res.status(500).json({
                ok: false,
                err
            })
        }
        res.status(200).json({
            ok: true,
            message: 'Usuario creado y a la espera de habilitación por parte del admnistrador del programa',
        })
    })

}


export const getUsers = (req: Request, res: Response) => {

    let from = Number(req.query.from) || 0;
    let limit = Number(req.query.limit) || 5;

    User.find()
        .skip(from)
        .limit(limit)
        .populate('projects', 'name _id description img')
        .populate('img')
        .exec((err: Error, usersDb: IUser[]) => {
            if (err) {
                console.log({ err })
                return res.status(500).json({
                    ok: false,
                    err
                })
            }
            if (!usersDb) {
                return res.status(404).json({
                    ok: false,
                    message: 'There are no user in DB'
                })
            }
            User.countDocuments({ $nor: [{ _id: req.body.userToken._id }] }, (err, count: number) => {
                if (err) {
                    return res.status(500).json({
                        ok: false,
                        err
                    })
                }
                if (process.env.DEMO) {
                    usersDb = usersDb.filter((user) => { return user.email != 'frjmartinezgomez@gmail.com' })
                }
                res.status(200).json({
                    ok: true,
                    users: usersDb,
                    count
                })
            })
        })
}



