

import mongoose, { Schema, Document } from 'mongoose';
import { IUser } from './user.model';

import uniqueValidator = require("mongoose-unique-validator");

export interface IProject extends Document {

    name:string,
    participants: mongoose.Types.ObjectId[] | IUser[],

    administrators: mongoose.Types.ObjectId[] | IUser[],

    status:boolean,

}


const projectSchema = new Schema({
    name: { type: String, unique: true, required: [true, "Name is required"] },
    participants: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null }],
    administrators: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null }],
    status: { type: Boolean, default: true },
});

projectSchema.plugin(uniqueValidator, { message: '{PATH} must be unique' });


const Project = mongoose.model<IProject>('Project', projectSchema);

export default Project