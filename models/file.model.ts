
import mongoose, { Schema, Document } from 'mongoose';

import uniqueValidator = require("mongoose-unique-validator");
export interface IFile extends Document {
    name:string,
    title:string,
    mimeType:string
}

const fileSchema = new Schema({
    name: { type: String, unique: true, required: [true, "Name is required"] },
    title: { type: String, required: [true, "Title is required"] },
    mimeType: { type: String,required:true },
});

fileSchema.plugin(uniqueValidator);

const FileModel = mongoose.model<IFile>('FileModel', fileSchema);

export default FileModel