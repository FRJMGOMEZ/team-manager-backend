

import mongoose, { Schema, Document } from 'mongoose';
export interface IActionRequired extends Document {
    usersTo: mongoose.Types.ObjectId[],
    userFrom:mongoose.Types.ObjectId,
    property: string,
    options: string[],
    currentValue: string,
    item: { name: string, type: string, _id: string }

}

const actionRequiredSchema = new Schema({
    usersTo: [{ type:mongoose.Types.ObjectId,ref:'User'}],
    userFrom: { type: mongoose.Types.ObjectId, ref: 'User' },
    property:{type:String},
    options:[{type:String}],
    currentValue:{type:String},
    item: { type: Object }
});

const ActionRequired = mongoose.model<IActionRequired>('ActionRequired', actionRequiredSchema,'actionsrequired');

export default ActionRequired;

