"use strict";
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
exports.deleteFile = exports.postFile = exports.getTaskFiles = exports.getAwsFile = void 0;
const file_model_1 = __importDefault(require("../../models/file.model"));
const mongoose_1 = __importDefault(require("mongoose"));
const aws_bucket_1 = require("../../services/aws-bucket");
const message_model_1 = __importDefault(require("../../models/message.model"));
const AWSCrud = aws_bucket_1.AwsBucket.instance;
/* ACCESO A LOS ARCHIVOS DEL BUCKET DE AMAZON S3*/
exports.getAwsFile = (req, res) => {
    let fileName = req.params.name;
    AWSCrud.getFile(fileName).then((file) => {
        res.send(file);
    });
};
exports.getTaskFiles = (req, res) => {
    let id = new mongoose_1.default.Types.ObjectId(req.params.id);
    let skip = Number(req.query.skip);
    let limit = Number(req.query.limit);
    let title = req.query.title ? new RegExp(req.query.title) : '';
    let request = title ? message_model_1.default.aggregate([{ $match: { task: id } }, { $match: { "files.title": { $regex: title, $options: 'i' } } }]).unwind('$files') : message_model_1.default.aggregate([{ $match: { task: id } }]).unwind('$files');
    request.skip(skip).limit(limit).exec((err, filesDb) => {
        if (err) {
            return res.status(500).json({ ok: false, err });
        }
        file_model_1.default.find({ _id: filesDb.map((f) => { return f.files; }) }, (err, files) => {
            if (err) {
                return res.status(500).json({ ok: false, err });
            }
            res.status(200).json({ ok: true, files });
        });
    });
};
/* POSTEO DE ARCHIVOS */
exports.postFile = (req, res) => {
    let file = req.files ? req.files.file : undefined;
    if (!file) {
        return res.status(400).json({
            ok: false,
            message: 'No files have been selected'
        });
    }
    let newFile;
    /* GUARDAMOS EL ARCHIVO EN EL BUCKET S3 */
    AWSCrud.recordFile(res, file).then((response) => __awaiter(void 0, void 0, void 0, function* () {
        newFile = yield new file_model_1.default({
            name: response.fileName,
            title: file ? file.name : 'NO-TITLE',
            download: Boolean(req.params.download),
            format: response.extension,
            production: true ? process.env.URLDB != 'mongodb://localhost:27017/escuelaAdminDb' : false
        });
        /* CREAMOS EL ARCHIVO EN LA BASE DE DATOS */
        newFile.save((err, fileSaved) => {
            if (err) {
                AWSCrud.deleteFile(res, fileSaved._id).then(() => {
                    return res.status(500).json({
                        ok: false,
                        err
                    });
                });
            }
            res.status(200).json({ file: fileSaved });
        });
    }));
};
exports.deleteFile = (req, res) => {
    let fileId = new mongoose_1.default.Types.ObjectId(req.params.fileId);
    AWSCrud.deleteFile(res, fileId).then((fileDeleted) => {
        message_model_1.default.findOneAndDelete({ files: { $in: [fileId] } }, (err, messageDeleted) => {
            if (err) {
                return res.status(500).json({
                    ok: false,
                    err
                });
            }
            res.status(200).json({ ok: true, file: fileDeleted });
        });
    });
};
