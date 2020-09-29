import {Response,Request,NextFunction} from 'express';


export const  checkDemo = (req:Request, res:Response, next:NextFunction) => {

    if (req.body.user) {
        if (req.body.user.userDb) {
            if (req.body.user.userDb.email === 'frjmartinezgomez@gmail.com') {
                next()
            } else {
                if (process.env.DEMO) {
                    return res.status(403).json({ ok: false, message: 'Función no habilitada en la versión DEMO' })
                } else {
                    next()
                }
            }
        }
    } else {
        if (process.env.DEMO) {
            return res.status(403).json({ ok: false, message: 'Función no habilitada en la versión DEMO' })
        } else {
            next()
        }
    }
}

module.exports = { checkDemo }