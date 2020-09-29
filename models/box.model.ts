

import mongoose, { Schema, Document } from 'mongoose';
import { IMessage } from './message.model';

export interface IBox extends Document {
    projects: {_id:mongoose.Types.ObjectId,lastConnection:number}[],

    messages: mongoose.Types.ObjectId[] | IMessage[],

    events: mongoose.Types.ObjectId[]
}

const boxSchema = new Schema({
    projects: [{ _id: { type: mongoose.Schema.Types.ObjectId, ref: 'Project' }, lastConnection: { type: Number, default: new Date().getTime() } }],
    messages: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Message' }],
    events: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Event' }]
}, { collection: 'boxes' });

const Box = mongoose.model<IBox>('Box', boxSchema);
export default Box