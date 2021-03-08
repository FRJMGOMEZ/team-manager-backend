import { Request, Response } from 'express'
import Message from '../../models/message.model';
import mongoose from 'mongoose';
import { IMessage } from '../../models/message.model';
import Task from '../../models/task.model';
import { ITask } from '../../models/task.model';
import { AwsBucket } from '../../services/aws-bucket';
import { SocketUsersList } from '../../sockets-config/socket-users-list';

const awsBucket = AwsBucket.instance;
const socketUsersList = SocketUsersList.instance;

const broadcastMessage = (message: IMessage) => {
    socketUsersList.broadcast((message.user as any)._id.toString(), message, 'message-in',(message.task as any)._id.toString())
}
export const postMessage = (req:Request, res: Response) =>{

  const files = req.files;
  const body = req.body;
  const taskId = req.params.taskId;

  Task.findById(taskId,(err,taskDb:ITask)=>{
      if (err) {
          return res.status(500).json({ ok: false, err })
      }
      if (!taskDb) {
          return res.status(404).json({ ok: false, message: 'The ID introduced do not match with any task' })
      }

      const filePosts: Promise<any>[] = []
      if (files) {
          Object.keys(files).forEach((k: any) => {
              filePosts.push(awsBucket.recordFile(res, files[k]))
          })
      }
      Promise.all(filePosts).then((files: mongoose.Types.ObjectId[]) => {
          let newMessage = new Message({
              user: body.userInToken._id,
              files,
              text: body.text,
              date: body.date,
              task:taskDb._id
          })
          newMessage.save((err, messageSaved: IMessage) => {
              if (err) {
                  return res.status(500).json({ ok: false, err })
              }
              messageSaved
                  .populate({
                      path: 'user',
                      model: 'User',
                      select: 'name _id'
                  })
                  .populate({path:'task',model:'Task',select:'project'})
                  .populate('files').execPopulate().then((messagePopulated: IMessage) => {
                      broadcastMessage(messagePopulated)
                      res.status(200).json({ ok: true, message: messagePopulated });
                  })
          })
      })
  })
}

export const getMessages = (req:Request,res:Response)=>{
    const taskId =req.params.taskId as any;
    const skip = Number(req.headers.skip);
    const limit = Number(req.headers.limit);
    Message.countDocuments({ task: taskId}, (err, count: number) => {
        if (err) {
            return res.status(500).json({ ok: false, err })
        }
        Message.find({ task: taskId}).sort({ _id: -1 })
            .skip(skip)
            .limit(limit)
            .populate('user')
            .populate('files')
            .exec((err, messagesDb) => {
                if (err) {
                    return res.status(500).json({ ok: false, err })
                }
                res.status(200).json({ ok: true, data: { messages: messagesDb, count } })
            })
    })

}



