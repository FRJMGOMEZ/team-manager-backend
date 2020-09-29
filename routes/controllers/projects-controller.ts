

import {Request,Response} from 'express';
import Project from '../../models/project.model';
import User, { IUser } from '../../models/user.model';
import mongoose from 'mongoose';
import Box, { IBox } from '../../models/box.model';
import {AwsBucket} from '../../services/aws-bucket'
import EventModel from '../../models/event.model';
import { IEventModel } from '../../models/event.model';
import Message from '../../models/message.model';
import { IMessage } from '../../models/message.model';
import { IFile } from '../../models/file.model';
import Task from '../../models/task.model';
import { IProject } from '../../models/project.model';
import { SocketUsersList } from '../../sockets-config/socket-users-list';

const AWSCrud = AwsBucket.instance;

const socketUsersList = SocketUsersList.instance;
const emitProjectChange = (userId: string, payload: { project: IProject, method: string, user: string, projectOld?: IProject })=>{
      socketUsersList.emit(userId,payload,'projects-change')
}
export const getProjects = (req:Request,res:Response)=>{
    let userOnline = req.body.user;
    Project.find({ participants: userOnline._id })
        .exec((err:Error, projectsDb:IProject[]) => {
            if (err) {
                return res.status(500).json({ ok: false, err })
            }
            if (!projectsDb) {
                return res.status(200).json({ ok: true, projects: [] })
            }
            projectsDb.forEach((eachProject) => {
                if (eachProject.administrators.indexOf(userOnline._id) < 0 &&
                    eachProject.status === false) {
                    projectsDb = projectsDb.filter((project) => { return project._id != eachProject._id })
                }
            })
            res.status(200).json({ ok: true, projects: projectsDb })
        })
}

export const getProjectById = (req: Request, res: Response)=>{

    let id = req.params.id;

    Project.findById(id)
    .populate(
        'administrators'
    )
    .populate(
       'participants'
    )
   .exec((err, projectDb)=>{
        if (err) {
            return res.status(500).json({ ok: false, err })
        }
        if (!projectDb) {
            return res.status(200).json({ ok: true, message:'No project has been found with the ID provided'})
        }
        res.status(200).json({ok:true,project:projectDb})
    })
}

export const postProject = (req: Request, res: Response)=>{

    let body = req.body;
    let project = new Project({
        name: body.name,
        participants: body.participants,
        administrators: body.administrators,
    })
    project.save((err:Error, projectSaved:IProject) => {
        if (err) {
            return res.status(500).json({ ok: false, err })
        }

            let requests: Promise<any>[] = [];

            let newProject = { _id: projectSaved._id, lastConnection: new Date().getTime() }

            projectSaved.participants.forEach((eachParticipant: IUser | mongoose.Types.ObjectId) => {
                requests.push(addProjectToParticipant(res, (eachParticipant as mongoose.Types.ObjectId).toString(), newProject))
            })
            Promise.all(requests).then(() => {
                res.status(200).json({ project: projectSaved })
                let user = req.body.user;
                emitProjectChange(user._id,{project:projectSaved,method:'POST',user:user.name})
            })
        
    })
}


export const putProject = (req: Request, res: Response)=>{

    let body = req.body;

    Project.findByIdAndUpdate(body._id, { name: body.name, description: body.description, administrators: body.administrators, participants: body.participants })
        .exec((err, projectDb:IProject) => {
            if (err) {
                return res.status(500).json({ ok: false, err })
            }
            if (!projectDb) {
                return res.status(404).json({ ok: false, message: 'There are no projects with the ID provided' })
            }

            let newProject = { _id: projectDb._id, lastConnection: new Date().getTime() }

            let requests = [Promise.resolve()];

            let projectDbParticipants = ((projectDb.participants) as mongoose.Types.ObjectId[]).map((participant: mongoose.Types.ObjectId) => { return participant.toString() });

            let participantsAddRequests:Promise<any>[] = body.participants.filter((participant:string) => { return !projectDbParticipants.includes(participant) }).map((participantToAdd:string) => { return addProjectToParticipant(res, participantToAdd, newProject) })

            let participantsRemoveRequests: Promise<any>[] = projectDbParticipants.filter((participant:string) => { return !body.participants.includes(participant) }).map((participantToRemove:string) => { return removeProjectToParticipant(res, participantToRemove, projectDb._id) })

            requests.push(...participantsAddRequests, ...participantsRemoveRequests);

            Promise.all(requests).then(() => {

                body._id = projectDb._id;

                res.status(200).json({ ok: true, project: body })

            })
        })
}

const addProjectToParticipant = (res: Response, userId: string, newProject:{_id:mongoose.Types.ObjectId,lastConnection:number}) => {
    return new Promise((resolve, reject) => {
        User.findById(userId, (err, userDb:IUser) => {
            if (err) {
                reject(res.status(500).json({ ok: false, err }))
            }
            if (!userDb) {
                reject(res.status(404).json({ ok: false, message: 'No user has been found' }))
            }
            Box.findByIdAndUpdate(userDb.box, { $push: { projects: newProject } }).exec((err:Error, boxUpdated:IBox) => {
                if (err) {
                    reject(res.status(500).json({ ok: false, err }))
                }
                if (!boxUpdated) {
                    reject(res.status(404).json({ ok: false, message: 'No box has been found' }))
                }
                resolve()
            })
        })
    })
}

const removeProjectToParticipant = (res: Response, userId: string, projectId: mongoose.Types.ObjectId) => {
    return new Promise((resolve, reject) => {
        User.findById(userId, (err, userDb:IUser) => {
            if (err) {
                reject(res.status(500).json({ ok: false, err }))
            }
            if (!userDb) {
                reject(res.status(404).json({ ok: false, message: 'No user has been found' }))
            }
            Box.findByIdAndUpdate(userDb.box, { $pull: { 'projects': { '_id': projectId } } })
            .exec((err, boxUpdated:IBox) => {
                if (err) {
                    reject(res.status(500).json({ ok: false, err }))
                }
                if (!boxUpdated) {
                    reject(res.status(404).json({ ok: false, message: 'No box has been found' }))
                }
                resolve()
            })
        })
    })
}
export const getParticipants = (req: Request, res: Response)=>{

    let projectId = req.params.id;

    Project.findById(projectId).distinct('participants').exec((err, participantsDb: mongoose.Types.ObjectId[]) => {
        if (err) {
            return res.status(500).json({ ok: false, message: err })
        }

        User.find({ '_id': participantsDb }).exec((err, usersDb:IUser[]) => {
            if (err) {
                return res.status(500).json({ ok: false, message: err })
            }

            res.status(200).json({ ok: true, participants: usersDb })
        })
    })
}


/* app.put('/lastConnection/:projectId', verifyToken, (req, res) => {
    let userOnline = req.user.userDb;
    let projectId = req.params.projectId;
    let newProject = { _id: projectId, lastConnection: new Date() }
    User.findOneAndUpdate({ _id: userOnline._id, 'projects._id': projectId }, { $set: { 'projects': newProject } }, { new: true })
        .populate('img')
        .exec((err, userUpdated) => {
            if (err) {
                return res.status(500).json({ ok: false, mensaje: err })
            }
            if (!userUpdated) {
                return res.status(404).json({ ok: false, message: 'No users have been found' })
            }
            res.status(200).json({ ok: true, user: userUpdated })
        })
}) */


/* app.put('/project/changeStatus/:id', (req, res) => {

    let id = req.params.id;
    Project.findById(id, (err, projectDb) => {
        if (err) {
            return res.status(500).json({ ok: false, err })
        }
        if (!projectDb) {
            return res.status(404).json({ ok: false, message: 'There are no projects with the ID provided' })
        }
        let request;
        if (projectDb.status === true) {
            request = Project.findByIdAndUpdate(projectDb._id, { status: false }, { new: true })
        } else {
            request = Project.findByIdAndUpdate(projectDb._id, { status: true }, { new: true })
        }
        request.exec((err, projectDb) => {
            if (err) {
                return res.status(500).json({ ok: false, err })
            }
            res.status(200).json({ ok: true, project: projectDb })
        })
    })
}) */


export const deleteProject = (req: Request, res: Response)=>{
    let id = req.params.id;
    Project.findByIdAndDelete(id)
        .exec((err, projectDeleted:IProject) => {
            if (err) {
                console.log({err})
                return res.status(500).json({ ok: false, err })
            }
            if (!projectDeleted) {
                return res.status(404).json({ ok: false, message: 'There are no projects with the ID provided' })
            }

            let promises:Promise<any>[] = [];

            /* DELETING EVENTS LINKED WITH THIS PROJECT */
            EventModel.find({ project: projectDeleted._id }, (err, eventsDb:IEventModel[]) => {

                if (err) {
                    return res.status(500).json({ ok: false, err })
                }

                let eventsIds = eventsDb.map((event) => { return event._id })

                eventsIds.forEach((id) => {
                    promises.push(removeProjectFromEvent(res, id ))
                })

                /*  DELETING MESSAGES OF PROJECT */
                projectDeleted.messages.forEach((id) => {
                    promises.push(deleteMessage(res, id))
                })

                /* UPDATING BOXES */
                Box.find({ 'projects._id': projectDeleted._id }, (err, boxesDb) => {

                    if (err) {
                        return res.status(500).json({ ok: false, err })
                    }

                    boxesDb.forEach((box) => {
                        promises.push(updateBox(res, box, projectDeleted._id.toString(), projectDeleted.messages))
                    })
                    /* DELETING PROJECT TASKS */
                    promises.push(deleteProjectTasks(res, projectDeleted._id))


                    Promise.all(promises).then(() => {

                        res.status(200).json({ ok: true, project: projectDeleted })
                        let user = req.body.user;

                        emitProjectChange(user._id,{project:projectDeleted,method:'DELETE',user:user.name})

                    }).catch((err:Error)=>{
                       return res.status(500).json({ok:false,err})
                    })
                })

            })
        })
}


const removeProjectFromEvent = (res:Response, eventId:mongoose.Types.ObjectId) => {
    return new Promise((resolve, reject) => {
        EventModel.findOneAndDelete(eventId)
        .exec( (err, eventDb:IEventModel) => {
            if (err) {
                reject(res.status(500).json({ ok: false, err }))
            }
            if (!eventDb) {
                reject(res.status(404).json({ ok: false, message: 'No events have been found wich matches with the ID provided' }))
            }
        })
    })
}

const deleteMessage = (res:Response, id:mongoose.Types.ObjectId) => {
    return new Promise((resolve, reject) => {
        Message.findByIdAndDelete(id)
            .populate('files')
            .exec((err:Error, messageDeleted:IMessage) => {
                if (err) {
                    reject(res.status(500).json({ ok: false, err }))
                }
                if (messageDeleted.files.length > 0) {
                    let promises:Promise<any>[] = (messageDeleted.files as IFile[]).map((file) => { return AWSCrud.deleteFile(res, file._id) });
                    Promise.all(promises).then(() => {
                        resolve(messageDeleted)
                    })
                } else {
                    resolve(messageDeleted)
                }
            })
    })
}

const updateBox = (res: Response, boxDb: IBox, projectDeletedId: mongoose.Types.ObjectId, messagesToDelete: mongoose.Types.ObjectId[]) => {
    return new Promise((resolve, reject) => {
        boxDb.projects = boxDb.projects.filter((project: { _id: mongoose.Types.ObjectId, lastConnection: number }) => { return project._id != projectDeletedId })
        boxDb.messages = (boxDb.messages as mongoose.Types.ObjectId[]) .filter((message) => { return !messagesToDelete.includes(message) })
        boxDb.save((err, boxSaved:IBox) => {
            if (err) {
                reject(res.status(500).json({ ok: false, err }))
            }
            resolve()
        })
    })
}

const deleteProjectTasks = (res: Response, projectDeletedId:mongoose.Types.ObjectId) => {
    return new Promise((resolve, reject) => {
        Task.deleteMany({ project: projectDeletedId }, (err) => {
            if (err) {
                reject(res.status(500).json({ ok: false, err }))
            }
            resolve()
        })
    })
}
