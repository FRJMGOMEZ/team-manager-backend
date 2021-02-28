

import mongoose, { Schema, Document } from 'mongoose';
import { IUser } from './user.model';
import { IProject } from './project.model';
export interface INotification extends Document {
    project: mongoose.Types.ObjectId | IProject
    task: mongoose.Types.ObjectId
    type:string
    modelName:string
    userFrom: mongoose.Types.ObjectId | IUser
    usersTo: {checked:boolean,user:mongoose.Types.ObjectId | IUser}[]
    method:string
    date:number
    item:any
    actionsRequired: mongoose.Types.ObjectId[],
    _id: string
    prevItem?:any

}

const notificationSchema = new Schema({
    project: { type: mongoose.Types.ObjectId, ref: 'Project' , required: true },
    task: { type: mongoose.Types.ObjectId, ref: 'Task'  },
    type:{type:String, required:true},
    modelName:{type:String,required:true},
    userFrom: { type: mongoose.Types.ObjectId, required: true, ref: 'User' },
    usersTo: { type:[{ checked:Boolean, user: mongoose.Types.ObjectId}]},
    method: { type: String, required: true  },
    date: { type: Number, default: new Date().getTime() },
    item: { type: mongoose.Types.ObjectId,ref:'type'},
    actionsRequired: [{ type: mongoose.Types.ObjectId, ref: 'ActionRequired'}],
    prevItem: { type:Object}
});



const Notification = mongoose.model<INotification>('Notification', notificationSchema);


export default Notification