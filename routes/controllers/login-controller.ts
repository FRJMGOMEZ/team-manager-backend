
import { Request, Response} from 'express';
import User from '../../models/user.model';
import * as bcrypt from 'bcrypt';
import * as jwt from 'jsonwebtoken';
import { IUser } from '../../models/user.model';
var atob = require('atob');

export const login = (req: Request, res: Response)=>{
    let credentials = req.body;
    User.findOne({ email: credentials.email })
        .populate('img')
        .exec(async (err: Error, userDb: IUser) => {
            if (err) {
                return res.status(500).json({ ok: false, err })
            }
            if (!userDb) {
                return res.status(404).json({ ok: false, message: 'Credenciales no válidas' })
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
            let token = await jwt.sign({ userDb }, process.env.TOKEN_SEED, { expiresIn: process.env.TOKEN_EXP });

            res.status(200).json({
                ok: true,
                user: userDb,
                _id: userDb._id,
                token
            })
        })
    }

export const checkToken = (req: Request, res: Response)=>{
         let token = req.get('token') as string;
         jwt.verify(token, process.env.TOKEN_SEED, async (err, data:any) => {
             if (err) {
                 return res.json({ message: 'Vuelva a intentar validarse, por favor' });
             }
             if (!data) {
                 return res.json({ message: 'Vuelva a intentar validarse, por favor' })
             }
             let userDb = await data.userDb;
                 let payload = await JSON.parse(atob(token.split('.')[1])); 
                verifyUpdate(payload.exp,userDb,token).then((tokenToGo)=>{ 
                    res.status(200).json({ token:tokenToGo}) 
               }) 
         })
     
 }   

 const verifyUpdate=(dateExp:number,userDb:IUser,token:string)=> {
   return new Promise(async(resolve, reject) => {
       let tokenExp = new Date(dateExp * 1000);
       let now = new Date();
       now = new Date(now.getFullYear(), now.getMonth(), now.getDate(), now.getHours(), now.getMinutes() + now.getTimezoneOffset())
       now.setTime(now.getTime() + 3600000 * 10)
       if (tokenExp.getTime() < now.getTime()) {
           let newtoken = await jwt.sign({ userDb }, process.env.TOKEN_SEED, { expiresIn: process.env.TOKEN_EXP});
           resolve(newtoken)
       } else {
           resolve(token)
       }
   })
} 

  


  




 
