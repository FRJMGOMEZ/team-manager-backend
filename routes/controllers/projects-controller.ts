

import { Request, Response } from 'express';
import Project, { IProject } from '../../models/project.model';
import User, { IUser } from '../../models/user.model';
import mongoose from 'mongoose';
import { AwsBucket } from '../../services/aws-bucket'
import EventModel from '../../models/event.model';
import { SocketUsersList } from '../../sockets-config/socket-users-list';

const AWSCrud = AwsBucket.instance;

const socketUsersList = SocketUsersList.instance;
const emitProjectChange = (userId: string, payload: { project: IProject, method: string, user: string, projectOld?: IProject }) => {
    socketUsersList.emit(userId, payload, 'projects-change')
}
export const getProjects = (req: Request, res: Response) => {
    let userOnline = req.body.userToken;
    Project.find({ participants: userOnline._id })
        .exec((err: Error, projectsDb: IProject[]) => {
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

export const getProjectById = (req: Request, res: Response) => {

    let id = req.params.id;

    Project.findById(id)
        .populate(
            'administrators'
        )
        .populate(
            'participants'
        )
        .exec((err, projectDb) => {
            if (err) {
                return res.status(500).json({ ok: false, err })
            }
            if (!projectDb) {
                return res.status(200).json({ ok: true, message: 'No project has been found with the ID provided' })
            }
            res.status(200).json({ ok: true, project: projectDb })
        })
}

export const postProject = (req: Request, res: Response) => {

    let body = req.body;
    let project = new Project({
        name: body.name,
        participants: body.participants,
        administrators: body.administrators,
    })
    project.save((err: Error, projectSaved: IProject) => {
        if (err) {
            return res.status(500).json({ ok: false, err })
        }
        res.status(200).json({ project: projectSaved })
        let user = req.body.userToken;
        emitProjectChange(user._id, { project: projectSaved, method: 'POST', user: user.name })
    })
}


export const putProject = (req: Request, res: Response) => {

    let body = req.body;

    let project = {
        name: body.name,
        participants: body.participants,
        administrators: body.administrators,
        status: body.status
    }
    Project.findByIdAndUpdate(body._id, project, (err, projectDb) => {
        if (err) {
            return res.status(500).json({ ok: false, err })
        }
        if (!projectDb) {
            return res.status(404).json({ ok: false, message: 'There are no projects with the ID provided' })
        }
        
        body._id = projectDb._id;
        res.status(200).json({ ok: true, project: body })
        let user = req.body.userToken;
        emitProjectChange(user._id, { project: body, method: 'PUT', user: user.name, projectOld: projectDb })
    })
}

export const getParticipants = (req: Request, res: Response) => {

    let projectId = req.params.id;

    Project.findById(projectId).distinct('participants').exec((err, participantsDb: mongoose.Types.ObjectId[]) => {
        if (err) {
            return res.status(500).json({ ok: false, message: err })
        }

        User.find({ '_id': participantsDb }).exec((err, usersDb: IUser[]) => {
            if (err) {
                return res.status(500).json({ ok: false, message: err })
            }

            res.status(200).json({ ok: true, participants: usersDb })
        })
    })
}

export const deleteProject = (req: Request, res: Response) => {
    let id = req.params.id;
    Project.findByIdAndDelete(id)
        .exec((err, projectDeleted: IProject) => {
            if (err) {
                console.log({ err })
                return res.status(500).json({ ok: false, err })
            }
            if (!projectDeleted) {
                return res.status(404).json({ ok: false, message: 'There are no projects with the ID provided' })
            }

            deleteEvents(projectDeleted._id,res).then(()=>{
                res.status(200).json({ ok: true, project: projectDeleted })
                let user = req.body.userToken;
                emitProjectChange(user._id, { project: projectDeleted, method: 'DELETE', user: user.name })
            })
    })
}


const deleteEvents = (projectId:string,res:Response)=>{
    return new Promise((resolve,reject)=>{
        EventModel.deleteMany({ project: projectId })
        .exec((err, deletedEvents) => {
            if (err) {
                reject(res.status(500).json({ok:false,err}))
            }
            resolve()
        })
    })
}




