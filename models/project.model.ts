

import mongoose, { Schema, Document } from 'mongoose';
import { IUser } from './user.model';
import { PrevState } from './prev-state';
import { IActionRequired } from './action-required.model';

import uniqueValidator = require("mongoose-unique-validator");

export interface IProject extends Document {

    name:string,
    createdBy: mongoose.Types.ObjectId,
    participants: mongoose.Types.ObjectId[] | IUser[],
    administrators: mongoose.Types.ObjectId[] | IUser[],
    status:boolean,
    prevStates: PrevState[],
    actionsRequired?: mongoose.Types.ObjectId[] | IActionRequired[]

}

const projectSchema = new Schema({
    name: { type: String, unique: true, required: [true, "Name is required"] },
    createdBy: { type: mongoose.Types.ObjectId, ref: 'User', required:true },
    participants: [{ type: mongoose.Types.ObjectId, ref: 'User', default: null }],
    administrators: [{ type: mongoose.Types.ObjectId, ref: 'User', default: null }],
    status: { type: Boolean, default: true },
    prevStates: [{ user: { name: String, _id: String }, date: Number, changes: Object }],
    actionsRequired: [{ type: mongoose.Types.ObjectId, ref: 'ActionRequired' }],
});

projectSchema.plugin(uniqueValidator, { message: '{PATH} must be unique' });


const Project = mongoose.model<IProject>('Project', projectSchema);

export default Project