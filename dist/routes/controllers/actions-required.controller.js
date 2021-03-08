"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.removeActionRequired = exports.setActionRequired = void 0;
const action_required_model_1 = __importDefault(require("../../models/action-required.model"));
exports.setActionRequired = (res, itemDb, property, options, user, type) => {
    return new Promise((resolve, reject) => {
        const actionRequired = new action_required_model_1.default({ usersTo: itemDb.reviewers, userFrom: user._id, property, options, currentValue: itemDb.get(property), item: { name: itemDb.name, type, _id: itemDb._id } });
        actionRequired.save((err, actionRequiredDb) => {
            if (err) {
                reject(res.status(500).json({ ok: false, err }));
            }
            !itemDb.actionsRequired ? itemDb.actionsRequired = [actionRequired] : itemDb.actionsRequired.push(actionRequired);
            resolve(itemDb);
        });
    });
};
exports.removeActionRequired = (res, itemDb, property) => {
    return new Promise((resolve, reject) => {
        const actionR = itemDb.actionsRequired.find((ar) => { return ar.property === property; });
        if (actionR) {
            action_required_model_1.default.findByIdAndDelete(actionR._id, (err, actionRequiredDb) => {
                if (err) {
                    reject(res.status(500).json({ ok: false, err }));
                }
                itemDb.actionsRequired = itemDb.actionsRequired.filter((ar) => { return ar.property !== property; });
                resolve(itemDb);
            });
        }
        else {
            resolve(itemDb);
        }
    });
};
/*
0x4874f858dfd71620b3b291fea7f7792ae0c2d82d
*/ 
//# sourceMappingURL=actions-required.controller.js.map