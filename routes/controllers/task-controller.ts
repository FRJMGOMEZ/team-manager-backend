
import { Request, Response } from 'express'
import { SocketUsersList } from '../../sockets-config/socket-users-list';
import { IUser } from '../../models/user.model';
import { IProject } from '../../models/project.model';
import Notification from '../../models/notification.model';
import { INotification } from '../../models/notification.model';
import { ITask } from '../../models/task.model';
import Task from '../../models/task.model';
import mongoose from 'mongoose';
import  ObjectId from 'mongoose'



const socketUsersList = SocketUsersList.instance;
const broadcastTasksNotification = (user:{name:string,_id:string}, currentItem: ITask, method: string, oldItem?: ITask) => {
    if(oldItem){
        oldItem.participants = (oldItem.participants as any).map((p: any) => { return p._id });
    }
    currentItem.participants = (currentItem.participants as any).map((p: any) => { return p._id })
    const oldParticipants = oldItem ? oldItem.participants: [];
    const participants = [...currentItem.participants, ...oldParticipants].filter((eachParticipant) => { return eachParticipant.toString() != user._id.toString() })
    let notification = new Notification({ type: 'TaskModel', userFrom:user._id , usersTo: participants, method: method, checked: false, date: new Date().getTime(), item: currentItem._id, oldItem:oldItem ? {_id:oldItem._id,name:oldItem.name,participants:oldParticipants} : null})
    notification.save((err, notificationSaved:INotification) => {
        if (err) {
            throw (err)
        }
        let notificationToSend = { 
            type:notification.type,
            userFrom: user,
            usersTo:participants,
            method,
            checked:false,
            date:notification.date,
            item: currentItem, 
             oldItem:notification.oldItem,
            _id:notificationSaved._id }
        socketUsersList.broadcast(user._id, notificationToSend, 'tasks-change', (currentItem.project as IProject)._id.toString())  
    })
}

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
        task.populate({
            path: 'project',
            model: 'Project',
            select: 'name _id'
        }, (err, taskDb) => {
            if (err) {
                return res.status(500).json({ ok: false, err })
            }
            res.status(200).json({ ok: true, task: taskDb })
        })

        let user: IUser = req.body.userInToken;
        broadcastTasksNotification(user, taskSaved, 'POST')
    })
}

export const getTasks = (req: Request, res: Response) => {

    const from: number = req.query.from ? Number(req.query.from) : -8640000000000000;
    const to: number = req.query.to ? Number(req.query.to) : 8640000000000000
    const selector = req.params.selector;
    let participants:any = req.query.participants ? req.query.participants : null;
    if(participants != null){
        participants =  (participants as any[]).reduce((acum, string) => {
            acum.push(...string.split(','));
            return acum;
        }, [])
        participants = participants.map((p: string) => { return new mongoose.Types.ObjectId(p); })
    }
    let query = {};
    let querys = Object.keys(req.query).reduce((acum,key)=>{ key != 'from' && key != 'to'  ? acum[key] = req.query[key] : null; return acum },{} as any);
    if (querys._id && !ObjectId.isValidObjectId(querys._id)){
     return res.status(400).json({ok:false,message:'THE ID INTRODUCED HAS A WRONG FORMAT'})
    }
    switch (selector) {
        case 'day': query = { startDate: { $lte: from }, endDate: { $gte: from }, ...querys, participants: participants != null ? { $in: participants } : { $ne: null}  };
            break;
        case 'month': query = { startDate: { $lte: to }, endDate: { $gte: from }, ...querys, participants: participants != null ? { $in: participants } : { $ne: null }};
            break;
        case 'week': query = { startDate: { $lte: to }, endDate: { $gte: from }, ...querys, participants: participants != null ? { $in: participants } : { $ne: null } };
            break;
    }
    Task.find(query, (err: Error, tasksDb: ITask[]) => {

        if (err) {
            return res.status(500).json({ ok: false, err })
        }

        res.status(200).json({ ok: true, tasks: tasksDb })
    })
}


export const getTaskById = (req: Request, res: Response) => {

    let id = req.params.id;

    Task.findById(id)
        .populate({ path: 'user', model: 'User', select: 'name _id' })
        .populate({path:'participants',model:'User',select:'name _id'})
        .populate('project')
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

    Task.findById(id,(err,taskDb:ITask)=>{
        if (err) {
            return res.status(500).json({ ok: false, err })
        }
        if (!taskDb) {
            return res.status(404).json({ ok: true, message: 'No task has been found with the ID provided' })
        }  
       
        Task.findByIdAndUpdate(id, { ...body })
            .populate({
                path: 'project',
                model: 'Project',
                select: 'name _id'
            })
            .populate({
                path:'participants',
                model:'User',
                select:'name _id'
            })
            .exec((err, taskDb:ITask) => {
                if (err) {
                    return res.status(500).json({ ok: false, err })
                }
                if (!taskDb) {
                    return res.status(404).json({ ok: true, message: 'No task has been found with the ID provided' })
                }
                let prevState: { [key: string]: any } = calculatePrevState(req.body,taskDb)
                let user = {name:req.body.userInToken.name,_id:req.body.userInToken._id}
                Task.findByIdAndUpdate(id, { $push: { prevStates: prevState }},{new:true})
                    .populate({
                        path: 'user',
                        model: 'User',
                        select: 'name _id'
                    })
                    .populate({
                        path: 'participants',
                        model: 'User',
                        select: 'name _id'
                    })
                  .exec((err:Error, taskUpdated: ITask) => {
                    if (err) {
                        return res.status(500).json({ ok: false, err })
                    }
                    res.status(200).json({ ok: true, task: taskUpdated })
                    broadcastTasksNotification(user, taskUpdated, 'PUT', taskDb)
                })
            })      
    })
}

const calculatePrevState = (body:any,taskDb:any)=>{
    let prevState: { [key: string]: any } = { user: body.userInToken._id }
    Object.keys(body).forEach((key: string) => {
        if (key != 'userInToken') {
            if (key === 'user') {
                prevState[key] = { name: body.userInToken.name, _id: body.userInToken._id }
            } else {
                if (key === 'participants') {
                    let participants = taskDb.get(key);
                    let participantsIds = participants.map((p: any) => { return (p._id).toString() })
                    if (JSON.stringify(participantsIds) != JSON.stringify(body[key])) {
                        prevState[key] = participants.map((p: any) => { return { name: p.name, _id: p._id } })
                    }
                } else {
                    if (taskDb.get(key) != body[key]) {
                        prevState[key] = taskDb.get(key)
                    }
                }
            }
        }
    })
    return prevState;
}

export const toggleTaskStatus = (req: Request, res: Response) => {
    let status = req.body.status;
    let taskId = req.params.id;
    Task.findByIdAndUpdate(taskId, { status }, { new: true }, (err, taskUpdated) => {
        if (err) {
            return res.status(500).json({ ok: false, err })
        }
        if (!taskUpdated) {
            return res.status(404).json({ ok: true, message: 'No task has been found with the ID provided' })
        }
        res.status(200).json({ ok: true, task: taskUpdated })
    })
}

export const deleteTask = (req: Request, res: Response) => {

    let id = req.params.id;

    Task.findByIdAndDelete(id)
        .populate({
            path: 'project',
            model: 'Project',
            select: 'name _id'
        })
        .exec((err, taskDeleted) => {
            if (err) {
                return res.status(500).json({ ok: false, err })
            }
            if (!taskDeleted) {
                return res.status(404).json({ ok: true, message: 'No task has been found with the ID provided' })
            }
            res.status(200).json({ ok: true, task: taskDeleted })

            let user: IUser = req.body.userInToken;
            console.log({taskDeleted})
            broadcastTasksNotification(user, taskDeleted, 'DELETE')
        })

}
