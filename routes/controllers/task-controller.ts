
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

const socketUsersList = SocketUsersList.instance;

export const postTask = (req: Request, res: Response) => {
    let body = req.body;
    let task = new Task({
        name: body.name,
        description: body.description,
        user: body.userInToken._id,
        participants: body.participants,
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
        taskSaved.populate({
            path: 'participants',
            model: 'User',
            select: 'name _id'
        })
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
        .populate({ path: 'user', model: 'User', select: 'name _id' })
        .populate({ path: 'project', model: 'Project', select: 'name _id' })
        .populate({ path: 'participants', model: 'User', select: 'name _id' })
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

    let body = req.body;
    let id = req.params.id;

    Task.findById(id)
     .populate({ path: 'project', model: 'Project', select: 'name _id' })
     .populate({ path: 'participants', model: 'User', select: 'name _id' })
     .exec((err, taskDb: ITask)=>{
        if (err) {
            return res.status(500).json({ ok: false, err })
        }
        if (!taskDb) {
            return res.status(404).json({ ok: true, message: 'No task has been found with the ID provided' })
        }  
         Task.findByIdAndUpdate(id, { ...body }, { new: true })
            .populate({path: 'project', model: 'Project',select: 'name _id'})
            .populate({path:'participants',model:'User',select:'name _id'})
            .exec((err, taskUpdated:ITask) => {
                if (err) {
                    return res.status(500).json({ ok: false, err })
                }
                if (!taskUpdated) {
                    return res.status(404).json({ ok: true, message: 'No task has been found with the ID provided' })
                }
                let user = {name:req.body.userInToken.name,_id:req.body.userInToken._id}
                setPrevState(res,taskUpdated,taskDb,user).then((taskUpdated:ITask)=>{
                    createNotification(res, user, taskUpdated, 'PUT', taskDb).then(() => {
                        broadcastTasksEvents(taskUpdated, user._id, 'PUT', taskDb)
                        res.status(200).json({ ok: true, task: taskUpdated })
                    })
                })    
            })      
    })
}

export const switchTaskStatus = (req: Request, res: Response) => {
    const taskId = req.body.taskId;
    const newStatus = req.body.newStatus;
    const frontTime = req.body.frontTime;
    
    Task.findById(taskId)
        .populate({
            path: 'participants',
            model: 'User',
            select: 'name _id'
        })
        .populate({ path: 'project', model: 'Project', select: 'name _id' })
        .exec((err, taskDb)=>{
        if (err) {
            return res.status(500).json({ ok: false, err })
        }
        if (!taskDb) {
            return res.status(404).json({ ok: false, message: 'There are no tasks with the ID provided' })
        }
    switch(taskDb.status){
    case 'pending':
     taskDb.status = 'on review';
     taskDb.deliverDate = frontTime;
    break;
    case 'on review':
    if(newStatus === 'pending'){
     taskDb.status = 'pending';
        taskDb.extraTime += frontTime- taskDb.deliverDate;
     taskDb.deliverDate = 0;
    }else if(newStatus === 'done'){
    taskDb.status = 'done';
        taskDb.validationTime = frontTime;
    taskDb.extraTime += taskDb.validationTime - taskDb.deliverDate;
    }
    break;
    case 'done':
     taskDb.status = 'pending';
     taskDb.extraTime += frontTime - taskDb.validationTime;
     taskDb.validationTime = 0;
    break; 
    }
    taskDb.save((err,taskDbUpdated:ITask)=>{
        if (err) {
            return res.status(500).json({ ok: false, err })
        }
        taskDbUpdated
        .populate({path: 'participants',model: 'User',select: 'name _id'})
        .populate({ path: 'project', model: 'Project', select: 'name _id' })
        .execPopulate().then((taskPopulated)=>{
            let user = { name: req.body.userInToken.name, _id: req.body.userInToken._id }
            setPrevState(res,taskPopulated,taskDb,user).then((taskUpdated:ITask)=>{
                createNotification(res, user, taskUpdated, 'STATUS CHANGE', taskDb).then(() => {
                    broadcastTasksEvents(taskUpdated, user._id, 'STATUS CHANGE', taskDb)
                    res.status(200).json({ ok: true, task: taskUpdated })
                })
            })
        }).catch((err)=>{
            res.status(500).json({ok:false,err})
        });
    })
  })   
}

export const deleteTask = (req: Request, res: Response) => {

    let id = req.params.id;

    Task.findByIdAndDelete(id)
        .populate({
            path: 'participants',
            model: 'User',
            select: 'name _id'
        })
        .exec((err, taskDeleted) => {
            if (err) {
                return res.status(500).json({ ok: false, err })
            }
            if (!taskDeleted) {
                return res.status(404).json({ ok: true, message: 'No task has been found with the ID provided' })
            }
            Message.deleteMany({ task: taskDeleted._id }).exec((err,messagesDeleted)=>{
                if (err) {
                    return res.status(500).json({ ok: false, err })
                }
                let user: IUser = req.body.userInToken;
                createNotification(res,user, taskDeleted, 'DELETE',taskDeleted).then(() => {
                    broadcastTasksEvents(taskDeleted, user._id, 'DELETE', taskDeleted)
                    res.status(200).json({ ok: true, task: taskDeleted }) 
                })
            })
        })
}


export const setPrevState = (res: Response, currentTask: any, prevTask: ITask, user: any) => {
    return new Promise<ITask>((resolve, reject) => {

        let prevState: { [key: string]: any } = calculatePrevState(currentTask, prevTask, user);
        Task.findByIdAndUpdate(currentTask._id, { $push: { prevStates: prevState } }, { new: true })
            .populate({
                path: 'participants',
                model: 'User',
                select: 'name _id'
            })
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

const calculatePrevState = (currentTask:any, prevTask: ITask, user: any) => {
    let prevState: { [key: string]: any } = { user: user._id }
    Object.getOwnPropertyNames(currentTask._doc).forEach((key: string) => {
        if (key === 'user') {
            prevState[key] = { name: user.name, _id: user._id }
        } else {
            if (key === 'participants') {
                let participants = prevTask.get(key);
                let participantsIds = participants.map((p: any) => { return (p._id).toString() })
                if (JSON.stringify(participantsIds) != JSON.stringify((currentTask.participants as IUser[]).map((p)=>{ return p._id}))) {
                    prevState.participants = participants.map((p: any) => { return { name: p.name, _id: p._id } })
                }
            } else {
                if ( typeof prevTask.get(key) != 'object' && prevTask.get(key) != currentTask.get(key)) {
                    prevState[key] = prevTask.get(key)
                }
            }
        }
    })
    console.log({prevState})
    return prevState;
}

const createNotification = (res: Response, user: { name: string, _id: string }, task: ITask, method: string, prevTask: ITask) => {
    return new Promise<void>((resolve, reject) => {
        const oldParticipants = prevTask ? prevTask.participants : [];
        const recipients = [...task.participants, ...oldParticipants].map((p) => { return (p as IUser)._id }).filter((eachParticipant) => { return eachParticipant.toString() != user._id.toString() })
        let notification = new Notification({ project: task.project, task: task._id, type: 'Task', modelName: 'Task', userFrom: user._id, usersTo: recipients.map((p) => { return { checked: false, user: p } }), method: method, date: new Date().getTime(), item: task._id, oldItem: {name:prevTask.name,_id:prevTask._id} })
        postNotification(res, notification).then((notificationToSend: INotification) => {
            socketUsersList.broadcastToGroup(user._id, notificationToSend, 'notification', recipients.map((p) => { return p.toString() }))
            resolve();
        })
    })
}

const broadcastTasksEvents = (task: ITask, userId: string, method: string, prevTask?: ITask) => {
    const oldParticipants = prevTask ? prevTask.participants : [];
    const recipients = [...task.participants, ...oldParticipants].map((p) => { return (p as IUser)._id }).filter((eachParticipant) => { return eachParticipant.toString() != userId.toString() })
    socketUsersList.broadcastToGroup(userId, { task, method }, 'tasks-event', recipients.map((p) => { return p.toString() }))
}

