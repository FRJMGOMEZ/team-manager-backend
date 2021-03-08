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
const notificationSchema = new mongoose_1.Schema({
    project: { type: mongoose_1.default.Types.ObjectId, ref: 'Project', required: true },
    task: { type: mongoose_1.default.Types.ObjectId, ref: 'Task' },
    type: { type: String, required: true },
    modelName: { type: String, required: true },
    userFrom: { type: mongoose_1.default.Types.ObjectId, required: true, ref: 'User' },
    usersTo: { type: [{ checked: Boolean, user: mongoose_1.default.Types.ObjectId }] },
    method: { type: String, required: true },
    date: { type: Number, default: new Date().getTime() },
    item: { type: mongoose_1.default.Types.ObjectId, ref: 'type' },
    actionsRequired: [{ type: mongoose_1.default.Types.ObjectId, ref: 'ActionRequired' }],
    prevItem: { type: Object }
});
const Notification = mongoose_1.default.model('Notification', notificationSchema);
exports.default = Notification;
//# sourceMappingURL=notification.model.js.map