

import mongoose, { Schema ,Document } from 'mongoose';

import uniqueValidator = require("mongoose-unique-validator");

const validRoles = {
    values: ['ADMIN_ROLE', 'USER_ROLE'],
    message: '{VALUE} is not a valid role'
};

export interface IUser extends Document {
    name:string,
    email:string,
    password:string,
    role: string,
    box: mongoose.Types.ObjectId, 
    img: mongoose.Types.ObjectId,
    status: boolean,
    events:  mongoose.Types.ObjectId[],
    resetCode?: string
}

const userSchema = new Schema({
    name: { type: String, require: true, unique: true },
    email: { type: String, require: true, unique: true },
    password: { type: String, required: [true, "Password is required"] },
    role: {
        type: String,
        required: false,
        default: "USER_ROLE",
        enum: validRoles
    },
    box: { type: mongoose.Schema.Types.ObjectId, ref: 'Box' },
    status: { type: Boolean, default: false },
    img: { type: mongoose.Schema.Types.ObjectId, ref: 'FileModel' },
    events: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Event' }],
    resetCode: { type: String }
});

userSchema.plugin(uniqueValidator);

const User = mongoose.model<IUser>('User', userSchema);

export default User