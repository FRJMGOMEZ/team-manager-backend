import mongoose, { Schema, Document } from 'mongoose';
import { IUser } from './user.model';
import { IProject } from './project.model';
import uniqueValidator = require("mongoose-unique-validator");

export interface ITask extends Document {
    name: string,
    description: string,
    user: mongoose.Types.ObjectId | IUser,
    participants: mongoose.Types.ObjectId[] | IUser[],
    priority: 1|2|3
    status:string
    startDate:number,
    endDate:number,
    deliverDate:number,
    validationTime:number,
    extraTime:number,
    prevStates: {[key: string]: any}[]
    project?: mongoose.Types.ObjectId | IProject ,
    _id: mongoose.Types.ObjectId
}

const taskSchema = new Schema({
    name: { type: String, required: true, unique:true },
    description: { type: String, required:true },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    participants:[{type:mongoose.Schema.Types.ObjectId, ref:'User',required:true}],
    priority:{type:Number,required:true},
    status: { type:String,default:'pending'},
    startDate:{type:Number,required:true},
    endDate:{type:Number,required:true},
    deliverDate: { type: Number },
    extraTime:{type:Number},
    prevStates: [{ type: Object}],
    project: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required:true },
});

taskSchema.plugin(uniqueValidator);

const Task = mongoose.model<ITask>('Task', taskSchema);

export default Task