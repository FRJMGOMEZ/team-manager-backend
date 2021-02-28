import mongoose, { Schema, Document } from 'mongoose';
import { IUser } from './user.model';
import { IProject } from './project.model';
import { PrevState } from './prev-state';
import { IActionRequired } from './action-required.model';
import uniqueValidator = require("mongoose-unique-validator");

export interface ITask extends Document {
    name: string,
    description: string,
    user: mongoose.Types.ObjectId | IUser,
    participants: mongoose.Types.ObjectId[] | IUser[]
    reviewers: mongoose.Types.ObjectId[] | IUser[]
    project: mongoose.Types.ObjectId | IProject,
    priority: 1|2|3
    status:string
    startDate:number,
    endDate:number,
    deliverDate:number,
    validationTime:number,
    extraTime:number,
    prevStates: PrevState[]
    actionsRequired?: mongoose.Types.ObjectId[] | IActionRequired[],
    _id: mongoose.Types.ObjectId
}

const taskSchema = new Schema({
    name: { type: String, required: true, unique:true },
    description: { type: String, required:true },
    user: {
        type: mongoose.Types.ObjectId,
        ref: 'User',
        required: true
    },
    participants:[{type:mongoose.Types.ObjectId, ref:'User',required:true}],
    reviewers: [{ type: mongoose.Types.ObjectId,ref:'User' }],
    project: { type: mongoose.Types.ObjectId, ref: 'Project', required: true },
    priority:{type:Number,required:true},
    status: { type:String,default:'pending'},
    startDate:{type:Number,required:true},
    endDate:{type:Number,required:true},
    deliverDate: { type: Number },
    validationTime: {type:Number},
    extraTime:{type:Number},
    prevStates: [{user: {name: String,_id: String},date: Number,changes:Object}],
    actionsRequired: [{ type:mongoose.Types.ObjectId, ref:'ActionRequired' }],
});

taskSchema.plugin(uniqueValidator);

const Task = mongoose.model<ITask>('Task', taskSchema);

export default Task