"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDayByDate = void 0;
const day_model_1 = __importDefault(require("../../models/day.model"));
exports.getDayByDate = (req, res) => {
    let date = Number(req.params.date);
    day_model_1.default.findOne({
        date: { $eq: date }
    })
        .populate('hour0')
        .populate('hour1')
        .populate('hour2')
        .populate('hour3')
        .populate('hour4')
        .populate('hour5')
        .populate('hour6')
        .populate('hour7')
        .populate('hour8')
        .populate('hour9')
        .populate('hour10')
        .populate('hour11')
        .populate('hour12')
        .exec((err, dayDb) => {
        if (err) {
            return res.status(500).json({ ok: false, message: err });
        }
        res.status(200).json({ ok: true, day: dayDb });
    });
};
