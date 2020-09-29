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
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteFile = exports.recordFile = exports.getAwsFile = void 0;
const AWS = __importStar(require("aws-sdk"));
const file_model_1 = __importDefault(require("../models/file.model"));
let validExtensions = ['png', 'jpg', 'gif', 'jpeg', 'pdf', 'JPG'];
AWS.config.update({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
});
const s3 = new AWS.S3();
exports.getAwsFile = (fileName) => {
    return new Promise((resolve, reject) => {
        var params = {
            Bucket: process.env.AWS_BUCKET_NAME,
            Key: fileName
        };
        s3.getObject(params, function (err, data) {
            if (err)
                return err;
            resolve(data.Body);
        });
    });
};
exports.recordFile = (res, file) => {
    return new Promise((resolve, reject) => {
        let cuttedFile = file.name.split('.');
        let extension = cuttedFile[cuttedFile.length - 1];
        if (validExtensions.indexOf(extension) < 0) {
            return res.status(403).json({
                ok: false,
                message: `The extension of the file is not allowed, the allowed ones are:${validExtensions.join(', ')}`
            });
        }
        let fileName = `${new Date().getMilliseconds()}.${extension}`;
        var params = {
            Bucket: process.env.AWS_BUCKET_NAME,
            Body: file.data,
            Key: fileName
        };
        console.log(process.env["AWS_ACCESS_KEY_ID"]);
        console.log({ params });
        s3.upload(params, function (err, data) {
            console.log({ err });
            if (err) {
                return res.status(500).json({ ok: false, err });
            }
            resolve({ fileName, data, extension });
        });
    });
};
exports.deleteFile = (res, fileId) => {
    return new Promise((resolve, reject) => {
        file_model_1.default.findByIdAndDelete(fileId, (err, fileDeleted) => __awaiter(void 0, void 0, void 0, function* () {
            if (err)
                reject(res.status(500).json({
                    ok: false,
                    err
                }));
            if (!fileDeleted) {
                reject(res.status(404).json({ ok: false, message: 'There are no files with the ID provided' }));
            }
            var params = yield { Bucket: process.env.S3_BUCKET_NAME, Key: fileDeleted.name };
            s3.deleteObject(params, function (err, data) {
                if (err) {
                    reject(res.status(500).json({ ok: false, err }));
                }
                else {
                    resolve();
                }
            });
        }));
    });
};
