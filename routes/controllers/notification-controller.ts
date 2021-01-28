import { Request, Response } from 'express'
import Notification from '../../models/notification.model';
import mongoose from 'mongoose';
import { INotification } from '../../models/notification.model';
import { SocketUsersList } from '../../sockets-config/socket-users-list';


const socketUsersList = SocketUsersList.instance;
export const broadcastNotification = (notification:INotification,userId:string,room:string)=>{
       socketUsersList.broadcast(userId,notification,'notification',room)
}

export const postNotification = (res:Response,notification:INotification)=>{
   return new Promise<INotification>((resolve,reject)=>{
       notification.save((err, notificationSaved: INotification) => {
           if (err) {
               reject(res.status(500).json({ ok: false, err }))
           }
           notificationSaved
               .populate({ path: 'project', model: 'Project', select: 'name' })
               .populate({path:'item',model:notification.modelName})
               .populate({ path: 'userFrom', model: 'User' })
               .populate('task').execPopulate().then((notificationToSend: INotification) => {
                   if (err) {
                       reject(res.status(500).json({ ok: false, err }))
                   }
                   resolve(notificationToSend)
               }).catch((err) => {
                   console.log({err})
                   reject(res.status(500).json({ ok: false, err }))
               })
       })
   })
}

export const getNotifications = (req: Request, res: Response) => {
    const skip = Number(req.headers.skip);
    const limit = Number(req.headers.limit);
    const id = req.params.userId;
    const objId = mongoose.Types.ObjectId(id);
    const checked =req.query.checked;
    let querys:any = {'usersTo.user': objId};
    checked ? querys['usersTo.checked'] = checked : null;


    Notification.count(querys,(err,count)=>{
        if (err) {
            return res.status(500).json({ ok: false, err })
        }
            Notification
                .find(querys)
                .skip(count - (limit + skip) >= 0 ? count - (limit + skip) : 0  )
                .limit( count - skip)
                .populate({ path: 'userFrom', model: 'User', select: 'name _id' })
                .populate({ path: 'project', model: 'Project', select: 'name' })
                .exec((err, notificationsDb) => {
                    if (err) {
                        return res.status(500).json({ ok: false, err })
                    }
                    console.log(notificationsDb.length)
                    res.status(200).json({ ok: true, notifications: notificationsDb,count })
                })
    })
}


export const getNotificationById = (req:Request,res:Response)=>{
    const id = req.params.id;
    Notification.findById(id)
    .populate({ path: 'userFrom', model: 'User' })
    .exec((err,notificationDb:INotification)=>{
        if (err) {
           return res.status(500).json({ ok: false, err })
        }
        if(!notificationDb){
           return res.status(404).json({ ok: false, message:'There are no notifications with the ID provided' })   
        }
        res.status(200).json({ ok: true, notification: notificationDb })
    })
}

const deleteNot = (res:Response,notificationId:string)=>{
  return new Promise((resolve,reject)=>{
     Notification.findByIdAndDelete(notificationId,(err:Error,notificationDeleted)=>{
         if (err) {
             reject(res.status(500).json({ ok: false, err }))
         }
         if (!notificationDeleted) {
             reject(res.status(404).json({ ok: false, message: 'No notification has been found with the ID provided' }))
         } 
         resolve(true)
     })
  }) 
}

const saveNot = (res:Response,notification:INotification)=>{
    return new Promise((resolve,reject)=>{
        notification.save((err, notificationUpdated) => {
            if (err) {
                reject(res.status(500).json({ ok: false, err }))
            }
            if (!notificationUpdated) {
                reject(res.status(404).json({ ok: false, message: 'No notification has been found with the ID provided' }))
            }
            resolve(true)
        })
    })
}

export const toggleNotification = (req: Request, res: Response)=>{
    const notificationId = req.body.notificationId;
    const itemId = req.body.itemId;
    const request:any = notificationId ? Notification.findById(notificationId) : Notification.find({item:itemId})
    request.exec((err:Error,notificationDb:INotification)=>{
         if(err){
             return res.status(500).json({ok:false,err})
         }
        if (!notificationDb) {
            return res.status(404).json({ ok: false, message: 'No notification has been found with the ID provided' })
        }
        const userId = req.body.userInToken._id.toString();
        notificationDb.usersTo = notificationDb.usersTo.map((ut)=>{ if(ut.user.toString() === userId){ ut.checked = !ut.checked; return ut};return ut; })

        if (notificationDb.usersTo.filter((r)=>{ return !r.checked}).length === 0){
            deleteNot(res, notificationDb._id).then(()=>{
                res.status(200).json({ ok: true })
              })
        }else{
            saveNot(res,notificationDb).then(()=>{
                res.status(200).json({ ok: true })
            })
        }
    })
}


