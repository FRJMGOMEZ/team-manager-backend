
import { Request, Response} from 'express';
import User from '../../models/user.model';
import * as bcrypt from 'bcrypt';
import * as jwt from 'jsonwebtoken';
import { IUser } from '../../models/user.model';
import UsersOnline from '../../models/users-online';
import mongoose from 'mongoose';

var atob = require('atob');

export const login = (req: Request, res: Response)=>{
    let credentials = req.body;
    User.findOne({ email: credentials.email })
        .populate('img')
        .exec(async(err: Error, userDb: IUser) => {
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
            let userInToken = userDb
            let token = await jwt.sign({ userInToken }, process.env.TOKEN_SEED, { expiresIn: 300000 });
              res.status(200).json({
                    ok: true,
                    user: userDb,
                    token
                });
        });
    }

export const checkToken = (req: Request, res: Response)=>{
         let token = req.get('token') as string;
         jwt.verify(token, process.env.TOKEN_SEED, async (err, data:any) => {
             if (err) {
                 return res.json(err);
             }
             if (!data) {
                 return res.status(401).json(({ok:false,message:'SESSION HAS EXPIRED'}))
             }
             return res.status(200).json({ok:true})
         })
 }   

/////// REFRESH TOKEN ///
export const refreshToken = (req: Request, res: Response) => {
    let token = req.get('token') as string;
    let payload = JSON.parse(atob(token.split('.')[1]));
    let {userInToken} = payload;
    User.findById(userInToken._id, async (err,userDb)=>{
        if(err){
            return res.status(500).json({ok:false,err})
        }

        if(!userDb){
            return res.status(401).json({ok:false,message:'SESSION HAS EXPIRED'})
        }
        userInToken = userDb;
        let token = await jwt.sign({ userInToken}, process.env.TOKEN_SEED, { expiresIn: 300000 });
        res.status(200).json({
            ok: true,
            user:userInToken,
            token
        })
    })
}

export const userOnline = (userIn: mongoose.Types.ObjectId )=>{
  return new Promise((resolve,reject)=>{
      UsersOnline.find({},(err,usersOnlineDb)=>{
          if(err){
              reject({ ok: false, err });
          }
          if(usersOnlineDb.length === 0){
              const newUsersOnline= new UsersOnline({users:[userIn]});
              newUsersOnline.save((err,usersOnlineSaved)=>{
                  if (err) {
                      reject({ ok: false, err }) 
                  }
                  resolve({ok:true}); 
              })
          }else{
              if(usersOnlineDb[0].users.includes(userIn)){
                  reject({ ok: false, message: 'Sorry, someone is currently using the user' })
              }else{
                  usersOnlineDb[0].users.push(userIn);
                  usersOnlineDb[0].save((err, userOnlineSaved) => {
                      if (err) {
                         reject({ ok: false, err })
                      }
                      resolve({ok:true});
                  });
              }
          };
      });
  });
}

export const userOffline = (userOut: mongoose.Types.ObjectId )=>{
    return new Promise((resolve,reject)=>{
        UsersOnline.find({},(err,usersOnlineDb)=>{
            if (err) {
                reject({ ok: false, err })
            }
            if(usersOnlineDb.length > 0){
                usersOnlineDb[0].users = usersOnlineDb[0].users.filter((u) => {return u.toString() != userOut.toString() });
                usersOnlineDb[0].save((err, userOnlineSaved) => {
                    if (err) {
                        reject({ ok: false, err })
                    }
                    resolve(true);
                });
            }else{
                resolve(true);
            }
        })
    })
}


  


  




 
