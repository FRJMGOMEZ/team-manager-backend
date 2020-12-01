"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.inMongoId = void 0;
const ObjectId = require('mongoose').Types.ObjectId;
exports.inMongoId = (id) => {
    return ObjectId.isValid(id);
};
