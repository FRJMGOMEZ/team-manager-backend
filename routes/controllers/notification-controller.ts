import { Request, Response } from 'express'
import Notification from '../../models/notification.model';
import mongoose from 'mongoose';
import { INotification } from '../../models/notification.model';
import { SocketUsersList } from '../../sockets-config/socket-users-list';
import ObjectId from 'mongoose';


const socketUsersList = SocketUsersList.instance;
export const broadcastNotification = (notification:INotification,userId:string,room:string)=>{
       socketUsersList.broadcastToRoom(userId,notification,'notification',room)
}

export const postNotification = (res:Response,notification:INotification)=>{
   return new Promise<INotification>((resolve,reject)=>{
       notification.save((err, notificationSaved: INotification) => {
           if (err) {
               reject(res.status(500).json({ ok: false, err }))
           }
           notificationSaved
               .populate({ path: 'project', model: 'Project', select: 'name _id' })
               .populate({ path: 'userFrom', model: 'User' })
               .populate({path:'item',model:notification.type, select:'name _id participants'})
               .populate({path:'actionsRequired',model:'ActionRequired',select:'usersTo'})
               .populate('task').execPopulate().then((notificationToSend: INotification) => {
                   if (err) {
                       reject(res.status(500).json({ ok: false, err }))
                   }
                   resolve(notificationToSend)
               }).catch((err) => {

                   reject(res.status(500).json({ ok: false, err }))
               })
       })
   })
}
export const putNotification = (req: Request, res: Response)=>{
    Notification.findByIdAndUpdate(req.params.id, req.body.changes)
        .populate({ path: 'userFrom', model: 'User', select: 'name _id' })
        .populate({ path: 'project', model: 'Project', select: 'name' })
        .populate({ path: 'actionsRequired', model: 'ActionRequired', select: 'usersTo' })
        .exec((err, notificationDb) => {
            if (err) {
                return res.status(500).json({ ok: false, err })
            }
            if(!notificationDb){
                return res.status(404).json({ ok: false, message: 'No notification has been found with the ID provided' })
            }
            res.status(200).json({ ok: true, notification: notificationDb })
        })
}


export const getNotifications = (req: Request, res: Response) => {
    const skip = Number(req.headers.skip);
    const limit = Number(req.headers.limit);
    const from = req.query.from ? Number(req.query.from) : '' ;
    const to = req.query.to ? Number(req.query.to) : '';
    const project = req.query.project;
    const userTo = req.query.userTo as string;
    const userFrom = req.query.userFrom as string;
    const checked = req.query.checked;
    const specialQuerys = ['from','to','userTo','checked','userFrom','project'];
    let querys = Object.keys(req.query).reduce((acum:{[key:string]:any},key)=>{ !specialQuerys.includes(key) ? acum[key] = req.query[key] : null ; return acum },{});
    userTo ?  querys['usersTo.user'] = mongoose.Types.ObjectId(userTo)  : null;
    checked ? querys['usersTo.checked'] = checked : null;
    /// FIXME
    /* userFrom ? ObjectId.isValidObjectId(userFrom) ? querys.userFrom = mongoose.Types.ObjectId(userFrom) : null: null */
    Notification.count({ ...querys, date: { $gte: from ? from : 0, $lte: to ? to : 9999999999999 }} , (err, count) => {
        if (err) {
            return res.status(500).json({ ok: false, err })
        }
        Notification
            .find({ ...querys, date: { $gte: from ? from : 0, $lte: to ? to : 9999999999999 }})
            .sort({ _id: -1 })
            .skip(skip)
            .limit(limit)
            .populate({ path: 'userFrom', model: 'User', select: 'name _id' })
            .populate({ path: 'project', model: 'Project', select: 'name' })
            .populate({ path: 'actionsRequired', model: 'ActionRequired', select: 'usersTo' })
            .exec((err, notificationsDb) => {
                if (err) {
                    return res.status(500).json({ ok: false, err })
                }
                const notifications= project ? notificationsDb.filter((n)=>{ return (n.project as any).name.includes(project)}) : notificationsDb;
                count-=notificationsDb.length - notifications.length;
                notificationsDb = notifications;
                res.status(200).json({ ok: true, notifications: notificationsDb, count })
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

/* const deleteNot = (res:Response,notificationId:string)=>{
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
} */

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
    request
        .populate({ path: 'userFrom', model: 'User', select: 'name _id' })
        .populate({ path: 'project', model: 'Project', select: 'name' })
        .populate({ path: 'actionsRequired', model: 'ActionRequired', select: 'usersTo' })
    .exec((err:Error,notificationDb:INotification)=>{
         if(err){
             return res.status(500).json({ok:false,err})
         }
        if (!notificationDb) {
            return res.status(404).json({ ok: false, message: 'No notification has been found with the ID provided' })
        }
        const userId = req.body.userInToken._id.toString();
        notificationDb.usersTo = notificationDb.usersTo.map((ut)=>{ if(ut.user.toString() === userId){ ut.checked = !ut.checked; return ut};return ut; })
        saveNot(res,notificationDb).then(()=>{
                res.status(200).json({ ok: true, notification: notificationDb })
        })
    })
}


