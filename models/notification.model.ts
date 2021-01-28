

import mongoose, { Schema, Document } from 'mongoose';
import { IUser } from './user.model';
export interface INotification extends Document {
    projects:mongoose.Types.ObjectId
    task:mongoose.Types.ObjectId
    type:string
    modelName:string
    userFrom: mongoose.Types.ObjectId | IUser
    usersTo: {checked:boolean,user:mongoose.Schema.Types.ObjectId | IUser}[]
    method:string
    date:number
    item:any
    _id: string
    oldItem?:any

}

const notificationSchema = new Schema({
    project: { type: mongoose.Schema.Types.ObjectId, ref: 'Project' , required: true },
    task: { type: mongoose.Schema.Types.ObjectId, ref: 'Task'  },
    type:{type:String, required:true},
    modelName:{type:String,required:true},
    userFrom: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'User' },
    usersTo: { type:[{ checked:Boolean, user: mongoose.Schema.Types.ObjectId}]},
    method: { type: String, required: true  },
    date: { type: Number, default: new Date().getTime() },
    item: { type: mongoose.Schema.Types.ObjectId,ref:'type'},
    oldItem: { type:Object}
});



const Notification = mongoose.model<INotification>('Notification', notificationSchema);


export default Notification