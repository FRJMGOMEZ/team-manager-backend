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
const uniqueValidator = require("mongoose-unique-validator");
const projectSchema = new mongoose_1.Schema({
    name: { type: String, unique: true, required: [true, "Name is required"] },
    participants: [{ type: mongoose_1.default.Schema.Types.ObjectId, ref: 'User', default: null }],
    administrators: [{ type: mongoose_1.default.Schema.Types.ObjectId, ref: 'User', default: null }],
    status: { type: Boolean, default: true },
    prevStates: [{ type: Object }]
});
projectSchema.plugin(uniqueValidator, { message: '{PATH} must be unique' });
const Project = mongoose_1.default.model('Project', projectSchema);
exports.default = Project;
