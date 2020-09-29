
import mongoose, { Schema, Document } from 'mongoose';

import uniqueValidator = require("mongoose-unique-validator");
export interface IFile extends Document {
    name:string,
    title:string,
    download:boolean,
    format:string,
    production: boolean
}

const fileSchema = new Schema({
    name: { type: String, unique: true, required: [true, "Name is required"] },
    title: { type: String, required: [true, "Title is required"] },
    download: { type: Boolean,required:true },
    format: { type: String,required:true },
    production: { type: Boolean, required: true }
});

fileSchema.plugin(uniqueValidator);

const FileModel = mongoose.model<IFile>('FileModel', fileSchema);

export default FileModel