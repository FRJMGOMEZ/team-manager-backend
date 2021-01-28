
import {Request,Response} from 'express'
import FileModel from '../../models/file.model';
import mongoose from 'mongoose';
import { AwsBucket } from '../../services/aws-bucket';
import Message from '../../models/message.model';
import { IMessage } from '../../models/message.model';

const AWSCrud = AwsBucket.instance;


/* ACCESO A LOS ARCHIVOS DEL BUCKET DE AMAZON S3*/

export const getAwsFile = (req:Request,res:Response)=>{
    let fileName = req.params.name;
    AWSCrud.getFile(fileName).then((file:any) => {
        res.send(file)
    })
}
export const getTaskFiles = (req: Request, res: Response) => {
    let id = new mongoose.Types.ObjectId(req.params.id);
    let skip = Number(req.query.skip);
    let limit = Number(req.query.limit);

    let title = req.query.title ? new RegExp(req.query.title as string) : '';

    let request = title ? Message.aggregate([{ $match: { task: id } }, { $match: { "files.title": { $regex: title, $options: 'i' } } }]).unwind('$files') : Message.aggregate([{ $match: { task: id } }]).unwind('$files')

    request.skip(skip).limit(limit).exec((err, filesDb) => {
        if (err) {
            return res.status(500).json({ ok: false, err })
        }
        FileModel.find({ _id: filesDb.map((f) => { return f.files }) }, (err, files) => {
            if (err) {
                return res.status(500).json({ ok: false, err })
            }
            res.status(200).json({ ok: true, files })
        })

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


export const deleteFile = (req: Request, res: Response)=>{
    let fileId = new mongoose.Types.ObjectId(req.params.fileId);
    AWSCrud.deleteFile(res, fileId ).then((fileDeleted) => {
        Message.findOneAndDelete({files: { $in:[fileId]}},(err:any,messageDeleted:IMessage | null)=>{
            if (err) {
            return res.status(500).json({
                        ok: false,
                        err
              })  
            }
            res.status(200).json({ ok: true, file: fileDeleted })   
        })
    })
}





