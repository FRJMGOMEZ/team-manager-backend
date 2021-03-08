

import mongoose, { Schema, Document } from 'mongoose';
export interface IUsersOnline extends Document {
    users: mongoose.Types.ObjectId[]
}

const usersOnlineSchema = new Schema({
    users: [{ type: mongoose.Types.ObjectId, ref: 'User' }]
});

const UsersOnline = mongoose.model<IUsersOnline>('UsersOnline', usersOnlineSchema, 'usersOnline');

export default UsersOnline;
