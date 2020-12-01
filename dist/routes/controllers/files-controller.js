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
exports.removeFile = exports.postFile = exports.getAwsFile = exports.getBackFile = void 0;
const path = __importStar(require("path"));
const fs = __importStar(require("fs"));
const file_model_1 = __importDefault(require("../../models/file.model"));
const mongoose_1 = __importDefault(require("mongoose"));
const aws_bucket_1 = require("../../services/aws-bucket");
const AWSCrud = aws_bucket_1.AwsBucket.instance;
exports.getBackFile = (req, res) => {
    let type = req.params.type;
    let fileName = req.params.fileName;
    if (type === 'icons') {
        let pathImage = path.resolve(__dirname, `../../../assets/${type}/${fileName}`);
        if (fs.existsSync(pathImage)) {
            res.sendFile(pathImage);
        }
        else {
            let pathNoImage = path.resolve(__dirname, '../../../assets/no-image.png');
            res.sendFile(pathNoImage);
        }
    }
    else if (type === 'company') {
        let pathImage = path.resolve(__dirname, `../../../assets/${type}/${fileName}`);
        if (fs.existsSync(pathImage)) {
            res.sendFile(pathImage);
        }
        else {
            let pathNoImage = path.resolve(__dirname, '../../../assets/no-image.png');
            res.sendFile(pathNoImage);
        }
    }
};
/* ACCESO A LOS ARCHIVOS DEL BUCKET DE AMAZON S3*/
exports.getAwsFile = (req, res) => {
    let fileName = req.params.name;
    AWSCrud.getFile(fileName).then((file) => {
        res.send(file);
        /*         res.send(file.toString('utf-8')) */
        /*  res.sendFile() */
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
exports.removeFile = (req, res) => {
    let fileId = new mongoose_1.default.Types.ObjectId(req.params.fileId);
    AWSCrud.deleteFile(res, fileId).then((fileDeleted) => {
        res.status(200).json({ ok: true, file: fileDeleted });
    });
};
