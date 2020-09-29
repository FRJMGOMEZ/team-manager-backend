

import mongoose, { Schema, Document } from 'mongoose';
import { IUser } from './user.model';
import { IProject } from './project.model';

export interface ITask extends Document{
  description:string,
  assignedBy:  mongoose.Types.ObjectId | IUser,
  user: mongoose.Types.ObjectId | IUser,
  project: mongoose.Types.ObjectId | IProject,
  date:Date,
  dateLimit:Date,
  ok:boolean,
  checked:boolean
}

const taskSchema = new Schema({
    description: { type: String, required: true },
    assignedBy: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'User' },
    user: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'User' },
    project: { type: mongoose.Schema.Types.ObjectId, require: true, ref: 'Project' },
    date: { type: Date, default: new Date() },
    dateLimit: { type: Date, default: new Date() },
    ok: { type: Boolean, default: false },
    checked: { type: Boolean, default: false }
});


const Task = mongoose.model<ITask>('Task', taskSchema);

export default Task