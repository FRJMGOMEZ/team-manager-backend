
import { Request, Response } from 'express'
import { SocketUsersList } from '../../sockets-config/socket-users-list';
import { IUser } from '../../models/user.model';
import Notification from '../../models/notification.model';
import { INotification } from '../../models/notification.model';
import { ITask } from '../../models/task.model';
import Task from '../../models/task.model';
import mongoose from 'mongoose';
import  ObjectId from 'mongoose'
import Message from '../../models/message.model';
import { postNotification} from './notification-controller';
import { PrevState } from '../../models/prev-state';
import { setActionRequired, removeActionRequired } from './actions-required.controller';

const ACTIONS_REQUIRED_PROPERTIES = ['status'];
const PREV_VERSION_SKIP_PROPERTIES = ['actionsRequired','_id']

const socketUsersList = SocketUsersList.instance;
export const postTask = (req: Request, res: Response) => {
    let body = req.body;
    let task = new Task({
        name: body.name,
        description: body.description,
        createdBy: body.userInToken._id,
        participants: body.participants,
        reviewers:body.reviewers,
        project: body.project ? body.project : null,
        startDate: body.startDate,
        endDate: body.endDate,
        priority: body.priority,
        prevStates:[]
    })
    task.save((err, taskSaved) => {
        if (err) {
            return res.status(500).json({ ok: false, err })
        }
        taskSaved
        .populate({path: 'participants',model: 'User',select: 'name _id'})
        .populate({path: 'reviewers',model: 'User',select: 'name _id'})
        .populate({ path: 'createdBy', model: 'User', select: 'name _id' })
        .populate({ path: 'actionsRequired', model: 'ActionRequired', populate: [{ path: 'usersTo', model: 'User', select: 'name _id' }, { path: 'userFrom', model: 'User', select: 'name _id' }] })
        .execPopulate().then((taskSaved)=>{
            let user: IUser = req.body.userInToken;
            createNotification(res, user, taskSaved, 'POST',taskSaved).then(() => {
                broadcastTasksEvents(taskSaved, user._id, 'POST')
                res.status(200).json({ ok: true, task: taskSaved })
            })
        }).catch((err)=>{
            res.status(500).json({ ok: false, err })
        })
    })
}

export const getTasks = (req: Request, res: Response) => {

    const skip = Number(req.headers.skip);
    const limit = Number (req.headers.limit);

    const from: number = req.query.from ? Number(req.query.from) : -8640000000000000;
    const to: number = req.query.to ? Number(req.query.to) : 8640000000000000;

    let participants: any = req.query.participants ? (req.query.participants as string[]).includes(req.body.userInToken._id.toString()) ? req.query.participants : [...req.query.participants as any[],req.body.userInToken] : [req.body.userInToken._id];
    if(participants != null){
        participants =  (participants as any[]).reduce((acum, string) => {
            acum.push(...string.split(','));
            return acum;
        }, [])
        participants = participants.map((p: string) => { return new mongoose.Types.ObjectId(p); })
    }
    let querys = Object.keys(req.query).reduce((acum,key)=>{ key != 'from' && key != 'to'  ? acum[key] = req.query[key] : null; return acum },{} as any);
    if (querys._id && !ObjectId.isValidObjectId(querys._id)){
     return res.status(400).json({ok:false,message:'THE ID INTRODUCED HAS A WRONG FORMAT'})
    }
    const query = { startDate: { $lte: to }, endDate: { $gte: from }, ...querys, participants: { $in: participants } }
    Task.find(query).skip(skip).limit(limit).exec((err: Error, tasksDb: ITask[]) => {
        if (err) {
            return res.status(500).json({ ok: false, err })
        }
        Task.find(query).countDocuments((err,count:NumberConstructor)=>{
            res.status(200).json({ ok: true, tasks: tasksDb,count})
        })
    })
}


export const getTaskById = (req: Request, res: Response) => {
    let id = req.params.id;
    Task.findById(id)
        .populate({ path: 'createdBy', model: 'User', select: 'name _id' })
        .populate({ path: 'project', model: 'Project', select: 'name _id' })
        .populate({ path: 'participants', model: 'User', select: 'name _id' })
        .populate({path: 'reviewers',model: 'User',select: 'name _id'})
        .populate({ path: 'actionsRequired', model: 'ActionRequired', populate: [{ path: 'usersTo', model: 'User', select: 'name _id' }, { path: 'userFrom', model: 'User', select: 'name _id' }] })
        .exec((err, taskDb) => {
            if (err) {
                return res.status(500).json({ ok: false, err })
            }
            if (!taskDb) {
                return res.status(404).json({ ok: false, message: 'No user has been found with the ID provided' })
            }
            res.status(200).json({ ok: true, task: taskDb })
        })
}

export const putTask = (req: Request, res: Response) => {

    let changes = req.body.changes;
    let id = req.params.id;

    Task.findById(id)
     .populate({ path: 'project', model: 'Project', select: 'name _id' })
     .populate({ path: 'participants', model: 'User', select: 'name _id' })
     .populate({path: 'reviewers',model: 'User',select: 'name _id'})
     .populate({ path: 'actionsRequired', model: 'ActionRequired',select:'property'})
     .populate({ path: 'createdBy', model: 'User', select: 'name _id' })
     .exec((err, taskDb: ITask)=>{
        if (err) {
            return res.status(500).json({ ok: false, err })
        }
        if (!taskDb) {
            return res.status(404).json({ ok: true, message: 'No task has been found with the ID provided' })
        }
         const taskPrev: ITask = JSON.parse(JSON.stringify((taskDb as any)._doc));
         const actionsRequiredOperations:Promise<any>[]= [];
         Object.keys(changes).forEach((k: string) => {
             if (ACTIONS_REQUIRED_PROPERTIES.includes(k)){
                 switch(k){
                     case 'status': actionsRequiredOperations.push(setStatusChange(res, taskDb, changes.status, req.body.userInToken));
                     break;
                 }
             }else{
                 taskDb.set(k, changes[k]);
             }
         });
         Promise.all(actionsRequiredOperations).then((response:ITask[])=>{
             if(response.length){
                 taskDb = response[response.length-1];
             }
             taskDb.save((err:any, taskDbUpdated: ITask) => {
                 if (err) {
                     return res.status(500).json({ ok: false, err });
                 }
                 taskDbUpdated
                     .populate({ path: 'participants', model: 'User', select: 'name _id' })
                     .populate({ path: 'project', model: 'Project', select: 'name _id' })
                     .populate({ path: 'reviewers', model: 'User', select: 'name _id' })
                     .populate({ path: 'createdBy', model: 'User', select: 'name _id' })
                     .execPopulate().then((taskPopulated) => {
                         let user = { name: req.body.userInToken.name, _id: req.body.userInToken._id };
                         setPrevState(res, taskPopulated, taskPrev, user).then((taskUpdated: ITask) => {
                             createNotification(res, user, taskUpdated, 'PUT', taskPrev, actionsRequiredOperations.length > 0 ? (taskDb.actionsRequired as any).map((ar:any)=>ar._id):[]).then(() => {
                                 broadcastTasksEvents(taskUpdated, user._id, 'PUT', taskPrev);
                                 res.status(200).json({ ok: true, task: taskUpdated });
                             })
                         })
                     }).catch((err) => {
                         res.status(500).json({ ok: false, err })
                     });
             });

         })    
    });
};

const setStatusChange = (res:Response,taskDb:ITask,newStatus:string,user:IUser)=>{
    return new Promise((resolve,reject)=>{
        let actionRequiredProm:Promise<any> = Promise.resolve(taskDb);
        switch (taskDb.status) {
            case 'pending':
                taskDb.status = 'on review';
                taskDb.deliverDate = new Date().getTime();
                actionRequiredProm = setActionRequired(res, taskDb,'status', ['done', 'pending'],user,'Task');
                break;
            case 'on review':
                if (newStatus === 'pending') {
                    taskDb.status = 'pending';
                    taskDb.extraTime = taskDb.extraTime ? taskDb.extraTime + new Date().getTime() - taskDb.deliverDate : new Date().getTime() - taskDb.deliverDate;
                    taskDb.deliverDate = 0;
                } else if (newStatus === 'done') {
                    taskDb.status = 'done';
                    taskDb.validationTime = new Date().getTime();
                    taskDb.extraTime = taskDb.extraTime ? taskDb.extraTime + new Date().getTime() - taskDb.deliverDate : new Date().getTime() - taskDb.deliverDate;
                }
                actionRequiredProm = removeActionRequired(res,taskDb, 'status')
                break;
            case 'done':
                taskDb.status = 'pending';
                taskDb.extraTime = taskDb.extraTime ? taskDb.extraTime + new Date().getTime() - taskDb.validationTime : new Date().getTime() - taskDb.validationTime;
                taskDb.validationTime = 0;
                actionRequiredProm = Promise.resolve(taskDb);
                break;
        } 
          actionRequiredProm.then((taskDb)=>{
                 resolve(taskDb);
        })
    })
}

export const deleteTask = (req: Request, res: Response) => {

    let id = req.params.id;

    Task.findByIdAndDelete(id)
        .populate({path: 'participants',model: 'User',select: 'name _id'})
        .populate({ path: 'reviewers', model: 'User', select: 'name _id' })
        .exec((err, taskDeleted) => {
            if (err) {
                return res.status(500).json({ ok: false, err })
            }
            if (!taskDeleted) {
                return res.status(404).json({ ok: true, message: 'No task has been found with the ID provided' })
            }
            Message.deleteMany({ task: taskDeleted._id as mongoose.Types.ObjectId }).exec((err,messagesDeleted)=>{
                if (err) {
                    return res.status(500).json({ ok: false, err })
                }
                let user: IUser = req.body.userInToken;
                createNotification(res,user, taskDeleted, 'DELETE',taskDeleted).then(() => {
                    broadcastTasksEvents(taskDeleted, user._id, 'DELETE', taskDeleted)
                    res.status(200).json({ ok: true, task: taskDeleted }) ;
                });
            });
        });
}

export const setPrevState = (res: Response, currentTask: any, prevTask: ITask, user: any) => {
    return new Promise<ITask>((resolve, reject) => {
        let prevState: PrevState = calculatePrevState(currentTask, prevTask, user);
        if(Object.keys(prevState.changes).length === 0){
            return res.status(403).json({ok:false,message:'The version you want to restore is equal to the current one'})
        }
        Task.findByIdAndUpdate(currentTask._id, { $push: { prevStates: prevState } }, { new: true })
            .populate({path: 'participants',model: 'User',select: 'name _id'})
            .populate({ path: 'reviewers', model: 'User', select: 'name _id' })
            .populate({ path: 'createdBy', model: 'User', select: 'name _id' })
            .populate({ path: 'actionsRequired', model: 'ActionRequired', populate: [{ path: 'usersTo', model: 'User', select: 'name _id' }, { path: 'userFrom', model: 'User', select: 'name _id' }] })
            .exec((err: Error, taskUpdated: ITask) => {
                if (err) {
                    reject(res.status(500).json({ ok: false, err }))
                }
                if (!taskUpdated) {
                    reject(res.status(404).json({ ok: false, message: 'There are no tasks with the ID provided' }))
                }
                resolve(taskUpdated)
            })
    })
}

const calculatePrevState = (currentTask:any, prevTask: any, user: any):PrevState => {
    let prevState: PrevState = { user:{name: user.name,_id:user._id },date:new Date().getTime(),changes:{}}
    prevTask = prevTask['_doc'] ? prevTask['_doc'] : prevTask;
    Object.getOwnPropertyNames(currentTask._doc).forEach((key: string) => {
        if ((key === 'participants' || key === 'reviewers') && (JSON.stringify(prevTask[key]) != JSON.stringify(currentTask.get(key)))) {
            prevState.changes[key] = (prevTask[key]  as any).map((u: any) => { return { _id: u._id, name: u.name } })
        } else if (!PREV_VERSION_SKIP_PROPERTIES.includes(key)) {
            if (JSON.stringify(prevTask[key]) != JSON.stringify(currentTask.get(key))) { prevState.changes[key] = prevTask[key] }
        }
    });
    return prevState;
}

const createNotification = (res: Response, user: { name: string, _id: string }, task: ITask, method: string, prevTask: ITask,actionsRequired:any=[]) => {
    return new Promise<void>((resolve, reject) => {
        const oldParticipants = prevTask ? prevTask.participants : [];
        let recipients = [...task.participants, ...oldParticipants].map((u)=>{  return (u as IUser)._id.toString()}).filter((u)=>{ return u.toString() != user._id});
        let notification = new Notification({ project: task.project, task: task._id, type: 'Task', modelName: 'Task', userFrom: user._id, usersTo: recipients.map((p) => { return { checked: false, user: p } }), method: method, date: new Date().getTime(), item: task._id, prevItem: {name:prevTask.name,_id:prevTask._id},actionsRequired})
        postNotification(res, notification).then((notificationToSend: INotification) => {
            socketUsersList.broadcastToGroup(user._id, notificationToSend, 'notification', recipients,true)
            resolve();
        })
    })
}

const broadcastTasksEvents = (task: ITask, userId: string, method: string, prevTask?: ITask) => {
    const oldParticipants = prevTask ? prevTask.participants : [];
    const recipients = [...task.participants, ...oldParticipants].filter((eachParticipant) => { return (eachParticipant as IUser)._id.toString() != userId.toString() }).map((u) => { return (u as IUser)._id })
    socketUsersList.broadcastToGroup(userId, { task, method }, 'tasks-event',recipients.map((p) => { return p.toString() }),false)
}

