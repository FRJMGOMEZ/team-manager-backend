

import mongoose, { Schema, Document } from 'mongoose';
import { IUser } from './user.model';
import { IProject } from './project.model';
import { IFile } from './file.model';
export interface IMessage extends Document{

    user:mongoose.Types.ObjectId | IUser,

    project:mongoose.Types.ObjectId | IProject,

    files:mongoose.Types.ObjectId[] | IFile[],

    text:string,

    date:number
}


const messageSchema = new Schema({
    user: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'User' },
    project: { type: mongoose.Schema.Types.ObjectId, require: true, ref: 'Project' },
    files: [{ type: mongoose.Schema.Types.ObjectId, require: true, ref: 'FileModel' }],
    text: { type: String },
    date: { type: Number, default: new Date().getTime() }
});

const Message = mongoose.model<IMessage>('Message', messageSchema);

export default Message


