

import mongoose, { Schema, Document } from 'mongoose';
import { IUser } from './user.model';
export interface INotification extends Document {

    type:string

    userFrom: mongoose.Types.ObjectId | IUser,

    usersTo: mongoose.Types.ObjectId[] | IUser[],

    method:string

    checked: boolean

    date:number

    item:any

    _id: string

    oldItem?:any

}

const notificationSchema = new Schema({
    type:{type:String, required:true},
    userFrom: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'User' },
    usersTo: [{ type: mongoose.Schema.Types.ObjectId, required: true, ref: 'User' }],
    method: { type: String, required: true  },
    checked:{ type:Boolean, default:false},
    date: { type: Number, default: new Date().getTime() },
    item: { type: mongoose.Schema.Types.ObjectId,ref:'type'},
    oldItem: { type: { id: String, name: String, participants: [mongoose.Schema.Types.ObjectId]} }
});



const Notification = mongoose.model<INotification>('Notification', notificationSchema);


export default Notification