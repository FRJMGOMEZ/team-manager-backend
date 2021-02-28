

import mongoose, { Schema, Document } from 'mongoose';
import { IUser } from './user.model';
export interface IMessage extends Document{
    user: mongoose.Types.ObjectId| IUser,
    files: mongoose.Types.ObjectId[],
    text:string,
    date:number,
    task: mongoose.Types.ObjectId
}


const messageSchema = new Schema({
    user:{type: mongoose.Types.ObjectId, required: true, ref: 'User' },
    files:[{type: mongoose.Types.ObjectId, ref: 'FileModel' }],
    text:{type: String },
    date:{type: Number, default: new Date().getTime() },
    task:{type:mongoose.Types.ObjectId,required:true}
});

const Message = mongoose.model<IMessage>('Message', messageSchema);

export default Message


