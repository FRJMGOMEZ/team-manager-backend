import { Request, Response } from 'express'
import Notification from '../../models/notification.model';
import mongoose from 'mongoose';

export const toggleNotification = (req: Request, res: Response)=>{

    let id = req.params.id;

    let checked = req.body.checked;

    Notification.findByIdAndUpdate(id,{checked},(err,notificationUpdated)=>{
            
         if(err){
             return res.status(500).json({ok:false,err})
         }

         if(!notificationUpdated){
            return res.status(404).json({ok:false,message:'No notification has been found with the ID provided'})
         }

        res.status(200).json({ok:true,notification: notificationUpdated})
    })

}


export const getNotifications = (req: Request, res: Response)=>{

    let id = req.params.userId;
    let objId = mongoose.Types.ObjectId(id);
    Notification
    .find({usersTo:objId})
    .populate({path:'userFrom',model:'User'})
    .populate({path:'item',model:'EventModel'})
    .exec((err,notificationsDb)=>{

        if(err){
            res.status(500).json({ok:false,err})
        }

        res.status(200).json({ok:true,notifications:notificationsDb})

    })
}