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
const eventSchema = new mongoose_1.Schema({
    name: { type: String, required: true, unique: true },
    description: { type: String, required: true },
    user: {
        type: mongoose_1.default.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    participants: [{ type: mongoose_1.default.Schema.Types.ObjectId, ref: 'User', required: true }],
    startDate: { type: Number, required: true },
    endDate: { type: Number, required: true },
    recursive: { type: Boolean, default: false },
    project: { type: mongoose_1.default.Schema.Types.ObjectId, ref: 'Project' },
    startTime: { type: String },
    endTime: { type: String },
    taskEvent: { type: Boolean, default: false }
});
eventSchema.plugin(uniqueValidator);
const EventModel = mongoose_1.default.model('EventModel', eventSchema);
exports.default = EventModel;
