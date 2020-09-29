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
const daySchema = new mongoose_1.Schema({
    date: { type: Number, required: true },
    hour0: [{ type: mongoose_1.default.Schema.Types.ObjectId, ref: 'EventModel', default: null }],
    hour1: [{ type: mongoose_1.default.Schema.Types.ObjectId, ref: 'EventModel', default: null }],
    hour2: [{ type: mongoose_1.default.Schema.Types.ObjectId, ref: 'EventModel', default: null }],
    hour3: [{ type: mongoose_1.default.Schema.Types.ObjectId, ref: 'EventModel', default: null }],
    hour4: [{ type: mongoose_1.default.Schema.Types.ObjectId, ref: 'EventModel', default: null }],
    hour5: [{ type: mongoose_1.default.Schema.Types.ObjectId, ref: 'EventModel', default: null }],
    hour6: [{ type: mongoose_1.default.Schema.Types.ObjectId, ref: 'EventModel', default: null }],
    hour7: [{ type: mongoose_1.default.Schema.Types.ObjectId, ref: 'EventModel', default: null }],
    hour8: [{ type: mongoose_1.default.Schema.Types.ObjectId, ref: 'EventModel', default: null }],
    hour9: [{ type: mongoose_1.default.Schema.Types.ObjectId, ref: 'EventModel', default: null }],
    hour10: [{ type: mongoose_1.default.Schema.Types.ObjectId, ref: 'EventModel', default: null }],
    hour11: [{ type: mongoose_1.default.Schema.Types.ObjectId, ref: 'EventModel', default: null }],
    hour12: [{ type: mongoose_1.default.Schema.Types.ObjectId, ref: 'EventModel', default: null }],
});
const Day = mongoose_1.default.model('Day', daySchema);
exports.default = Day;
