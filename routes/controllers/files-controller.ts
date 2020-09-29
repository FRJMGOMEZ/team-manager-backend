
import {Request,Response} from 'express'
import * as path from 'path';
import * as fs from 'fs';
import FileModel from '../../models/file.model';
import mongoose from 'mongoose';
import { AwsBucket } from '../../services/aws-bucket';

const AWSCrud = AwsBucket.instance;

export const getBackFile = (req:Request,res:Response)=>{

    let type = req.params.type;
    let fileName = req.params.fileName;
     
    if (type === 'icons') {
        let pathImage = path.resolve(__dirname, `../../../assets/${type}/${fileName}`);
        if (fs.existsSync(pathImage)) {
            res.sendFile(pathImage)
        } else {
            let pathNoImage = path.resolve(__dirname, '../../../assets/no-image.png');
            res.sendFile(pathNoImage)
        }
    } else if (type === 'company') {

        let pathImage = path.resolve(__dirname, `../../../assets/${type}/${fileName}`)
        if (fs.existsSync(pathImage)) {
            res.sendFile(pathImage)
        } else {
            let pathNoImage = path.resolve(__dirname, '../../../assets/no-image.png');
            res.sendFile(pathNoImage)
        }
    }
}


/* ACCESO A LOS ARCHIVOS DEL BUCKET DE AMAZON S3*/

export const getAwsFile = (req:Request,res:Response)=>{
    let fileName = req.params.name;
    AWSCrud.getFile(fileName).then((file) => {
        res.send(file)
    })
}

/* POSTEO DE ARCHIVOS */
export const postFile = (req: Request, res: Response)=>{

    let file = req.files ? req.files.file as any : undefined;

    if (!file) {
        return res.status(400).json({
            ok: false,
            message: 'No files have been selected'
        });
    }

    let newFile;
    /* GUARDAMOS EL ARCHIVO EN EL BUCKET S3 */
    AWSCrud.recordFile(res,file).then(async (response:any) => {
        newFile = await new FileModel({
            name: response.fileName,
            title: file ? file.name : 'NO-TITLE',
            download: Boolean(req.params.download),
            format: response.extension,
            production: true ? process.env.URLDB != 'mongodb://localhost:27017/escuelaAdminDb' : false
        })
        /* CREAMOS EL ARCHIVO EN LA BASE DE DATOS */
        newFile.save((err:Error, fileSaved) => {
            if (err) {
                AWSCrud.deleteFile(res, fileSaved._id).then(() => {
                    return res.status(500).json({
                        ok: false,
                        err
                    })
                })
            }
            res.status(200).json({ file: fileSaved })
        })
    })
}


export const removeFile = (req: Request, res: Response)=>{
    let fileId = new mongoose.Types.ObjectId(req.params.fileId);
    AWSCrud.deleteFile(res, fileId ).then((fileDeleted) => {
        res.status(200).json({ ok: true, file: fileDeleted })
    })
}





