import * as AWS from 'aws-sdk';
import { Response } from 'express';
import FileModel from '../models/file.model';
import mongoose from 'mongoose';
export class AwsBucket {

    public static _instance: AwsBucket;
    s3:any
    validExtensions = ['png', 'jpg', 'gif', 'jpeg', 'pdf', 'JPG','xlsx','docx'];
    private constructor(){
        AWS.config.update({
               accessKeyId: process.env.AWS_ACCESS_KEY_ID,
               secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
           });
        this.s3 = new AWS.S3();
   }
    public static get instance() {

        return this._instance || (this._instance = new this())

    }
   getFile(fileName:string){
      return new Promise((resolve, reject) => {
        var params:any = {
            Bucket: process.env.AWS_S3_BUCKET_NAME,
            Key: fileName
        };
        this.s3.getObject(params, function (err:AWS.AWSError, data:any) {
            if (err){ return err}
            resolve(data.Body)
        });
    })
   }
   recordFile(res:Response, file: any){
       return new Promise((resolve, reject) => {
           let cuttedFile = file.name.split('.');
           let extension = cuttedFile[cuttedFile.length - 1];
           if (this.validExtensions.indexOf(extension) < 0) {
               reject(res.status(403).json({
                   ok: false,
                   message: `The extension of the file is not allowed, the allowed ones are:${this.validExtensions.join(', ')}`
               }))
           }

           let fileName = `${new Date().getTime()}.${extension}`;
           var params: any = {
               Bucket: process.env.AWS_S3_BUCKET_NAME,
               Body: file.data,
               Key: fileName
           }

           this.s3.upload(params, function (err: any, data: any) {
               if (err) {
                   reject(res.status(500).json({ ok: false, err }))
               }

               let newFile = new FileModel({
                   name:fileName,
                   title:file.name,
                   type:file.mimetype
               })

               newFile.save((err,fileSaved)=>{
                   if (err) {
                       reject(res.status(500).json({ ok: false, err }))
                   }
                   resolve(fileSaved._id)
               })
           });
       })
   }

    deleteFile(res: Response, fileId: mongoose.Types.ObjectId){
        return new Promise((resolve, reject) => {
        FileModel.findByIdAndDelete(fileId, async (err, fileDeleted:any) => {
            if (err)
                reject(res.status(500).json({
                    ok: false,
                    err
                }));
            if (!fileDeleted) {
                reject(res.status(404).json({ ok: false, message: 'There are no files with the ID provided' }))
            }
            var params:any = await { Bucket: process.env.AWS_S3_BUCKET_NAME, Key: fileDeleted.name };
            this.s3.deleteObject(params, function (err:any, data:any) {
                if (err) {
                    reject(res.status(500).json({ ok: false, err }))
                } else {
                    resolve()
                }
            });
        })
    })
  }
}