import mongoose, { Schema, Document } from 'mongoose';
import { IUser } from './user.model';
import { IProject } from './project.model';
import uniqueValidator = require("mongoose-unique-validator");

export interface IEventModel extends Document {
    name: string,
    description: string,
    user: mongoose.Types.ObjectId | IUser,
    participants: mongoose.Types.ObjectId[] | IUser[],
    startDate:number,
    endDate:number,
    recursive:boolean,
    project?: mongoose.Types.ObjectId | IProject ,
    startTime?: string,
    endTime?: string,
    taskEvent?:boolean,
    _id: mongoose.Types.ObjectId
}

const eventSchema = new Schema({
    name: { type: String, required: true, unique:true },
    description: { type: String, required:true },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    participants:[{type:mongoose.Schema.Types.ObjectId, ref:'User',required:true}],
    startDate:{type:Number,required:true},
    endDate:{type:Number,required:true},
    recursive:{type:Boolean, default:false},
    project: { type: mongoose.Schema.Types.ObjectId, ref: 'Project' },
    startTime: { type: String},
    endTime: { type: String },
    taskEvent:{type:Boolean,default:false}
});

eventSchema.plugin(uniqueValidator);

const EventModel = mongoose.model<IEventModel>('EventModel', eventSchema);

export default EventModel