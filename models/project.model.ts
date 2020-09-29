

import mongoose, { Schema, Document } from 'mongoose';
import { IUser } from './user.model';
import FileModel from './file.model';
import { IFile } from './file.model';
import uniqueValidator = require("mongoose-unique-validator");

export interface IProject extends Document {

    name:string,
    participants: mongoose.Types.ObjectId[] | IUser[],

    administrators: mongoose.Types.ObjectId[] | IUser[],

    messages: mongoose.Types.ObjectId[],

    status:boolean,

    tasks: mongoose.Types.ObjectId[]
}


const projectSchema = new Schema({
    name: { type: String, unique: true, required: [true, "Name is required"] },
    participants: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null }],
    administrators: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null }],
    img: { type: mongoose.Schema.Types.ObjectId, ref: 'FileModel' },
    description: { type: String },
    messages: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Message', default: null }],
    status: { type: Boolean, default: true },
    tasks: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Task' }]
});

projectSchema.plugin(uniqueValidator, { message: '{PATH} must be unique' });


const Project = mongoose.model<IProject>('Project', projectSchema);

export default Project