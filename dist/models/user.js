"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importStar(require("mongoose"));
const uniqueValidator = require('mongoose-unique-validator');
const validRoles = {
    values: ['ADMIN_ROLE', 'USER_ROLE'],
    message: '{VALUE} is not a valid role'
};
const userSchema = new mongoose_1.Schema({
    name: { type: String, require: true, unique: true },
    email: { type: String, require: true, unique: true },
    password: { type: String, required: [true, "Password is required"] },
    role: {
        type: String,
        required: false,
        default: "USER_ROLE",
        enum: validRoles
    },
    box: { type: mongoose_1.default.Schema.Types.ObjectId, ref: 'Box' },
    status: { type: Boolean, default: false },
    img: { type: mongoose_1.default.Schema.Types.ObjectId, ref: 'FileModel' },
    events: [{ type: mongoose_1.default.Schema.Types.ObjectId, ref: 'Event' }],
    resetCode: { type: String }
});
userSchema.plugin(uniqueValidator, { message: '{PATH} must be unique' });
const User = mongoose_1.default.model('User', userSchema);
exports.default = User;
