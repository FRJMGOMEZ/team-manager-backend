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
const actionRequiredSchema = new mongoose_1.Schema({
    usersTo: [{ type: mongoose_1.default.Types.ObjectId, ref: 'User' }],
    userFrom: { type: mongoose_1.default.Types.ObjectId, ref: 'User' },
    property: { type: String },
    options: [{ type: String }],
    currentValue: { type: String },
    item: { type: Object }
});
const ActionRequired = mongoose_1.default.model('ActionRequired', actionRequiredSchema, 'actionsrequired');
exports.default = ActionRequired;
//# sourceMappingURL=action-required.model.js.map