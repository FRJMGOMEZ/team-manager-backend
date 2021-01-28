

import { Request, Response } from 'express';
import Project, { IProject } from '../../models/project.model';
import User, { IUser } from '../../models/user.model';
import mongoose from 'mongoose';
import Task from '../../models/task.model';
import { SocketUsersList } from '../../sockets-config/socket-users-list';
import Notification from '../../models/notification.model';
import { INotification } from '../../models/notification.model';
import { postNotification } from './notification-controller';

const socketUsersList = SocketUsersList.instance;

export const getProjects = (req: Request, res: Response) => {
    let userOnline = req.body.userInToken;
    Project.find({ participants: userOnline._id })
        .exec((err: Error, projectsDb: IProject[]) => {
            if (err) {
                return res.status(500).json({ ok: false, err })
            }
            if (!projectsDb) {
                return res.status(200).json({ ok: true, projects: [] })
            }
            projectsDb.forEach((eachProject) => {
                if (eachProject.administrators.indexOf(userOnline._id) < 0 && eachProject.status === false) {
                    projectsDb = projectsDb.filter((project) => { return project._id != eachProject._id });
                }
            });
            res.status(200).json({ ok: true, projects: projectsDb })
        });
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
                return res.status(500).json({ ok: false, err });
            }
            if (!projectDb) {
                return res.status(200).json({ ok: true, message: 'No project has been found with the ID provided' });
            }
            res.status(200).json({ ok: true, project: projectDb });
        })
}

export const postProject = (req: Request, res: Response) => {
    let body = req.body;
    let project = new Project({
        name: body.name,
        participants: body.participants,
        administrators: body.administrators,
    });
    project.save((err: Error, projectSaved: IProject) => {
        if (err) {
            return res.status(500).json({ ok: false, err });
        }
        res.status(200).json({ project: projectSaved });
        let user = req.body.userInToken;
        createNotification(res,{name:user.name,_id:user._id},projectSaved,'POST',projectSaved).then(()=>{
            broadcastProjectEvent(user._id, projectSaved,'POST' );
        });
    });
}


export const putProject = (req: Request, res: Response) => {

    let body = req.body;

    let project = {
        name: body.name,
        participants: body.participants,
        administrators: body.administrators,
        status: body.status
    };
    Project.findByIdAndUpdate(body._id, project, (err, projectDb) => {
        if (err) {
            return res.status(500).json({ ok: false, err })
        }
        if (!projectDb) {
            return res.status(404).json({ ok: false, message: 'There are no projects with the ID provided' })
        }
        Project.findById(projectDb._id,(err,projectUpdated:IProject)=>{
            let user = req.body.userInToken;
            setPrevState(res,projectUpdated,projectDb,user).then((projectUpdated)=>{
                createNotification(res, { name: user.name, _id: user._id }, projectUpdated, 'PUT', projectDb).then(() => {
                    broadcastProjectEvent(user._id, projectUpdated, 'PUT', projectDb);
                    res.status(200).json({ ok: true, project: projectUpdated });
                });
            })
        })
    });
}

export const getParticipants = (req: Request, res: Response) => {

    let projectId = req.params.id;

    Project.findById(projectId).distinct('participants').exec((err, participantsDb: mongoose.Types.ObjectId[]) => {
        if (err) {
            return res.status(500).json({ ok: false, message: err });
        }

        User.find({ '_id': participantsDb }).exec((err, usersDb: IUser[]) => {
            if (err) {
                return res.status(500).json({ ok: false, message: err });
            }

            res.status(200).json({ ok: true, participants: usersDb });
        });
    });
}

export const deleteProject = (req: Request, res: Response) => {
    let id = req.params.id;
    Project.findByIdAndDelete(id)
        .exec((err, projectDeleted: IProject) => {
            if (err) {
                return res.status(500).json({ ok: false, err });
            }
            if (!projectDeleted) {
                return res.status(404).json({ ok: false, message: 'There are no projects with the ID provided' });
            }

            deleteTasks(projectDeleted._id,res).then(()=>{
                res.status(200).json({ ok: true, project: projectDeleted });
                let user = req.body.userInToken;
                createNotification(res,{name:user.name,_id:user._id},projectDeleted,'DELETE',projectDeleted).then(()=>{
                    broadcastProjectEvent(user._id,  projectDeleted, 'DELETE');
                });
            });
    });
}


const deleteTasks = (projectId:string,res:Response)=>{
    return new Promise((resolve,reject)=>{
        Task.deleteMany({ project: projectId })
        .exec((err, deletedTasks) => {
            if (err) {
                reject(res.status(500).json({ok:false,err}));
            }
            resolve('');
        });
    });
}

export const setPrevState = (res: Response, currentProject: IProject, prevProject: IProject, user: any) => {
    return new Promise<IProject>((resolve, reject) => {
        let prevState: { [key: string]: any } = calculatePrevState(currentProject, prevProject, user);
        Project.findByIdAndUpdate(currentProject._id, { $push: { prevStates: prevState } }, { new: true })
            .exec((err: Error, projectUpdated: IProject) => {
                if (err) {
                    reject(res.status(500).json({ ok: false, err }))
                }
                if (!projectUpdated) {
                    reject(res.status(404).json({ ok: false, message: 'There are no tasks with the ID provided' }))
                }
                resolve(projectUpdated)
            })
    })
}

const calculatePrevState = (currentProject: any, prevProject: IProject, user: any) => {
    let prevState: { [key: string]: any } = { user: user._id }
    Object.keys(currentProject._doc).forEach((key: string) => {
        if (key === 'user') {
            prevState[key] = { name: user.name, _id: user._id }
        } else {
            if (key === 'participants') {
                let participants = prevProject.get(key);
                let participantsIds = participants.map((p: any) => { return (p._id).toString() })
                if (JSON.stringify(participantsIds) != JSON.stringify(currentProject[key])) {
                    prevState[key] = participants.map((p: any) => { return { name: p.name, _id: p._id } })
                }
            } else {
                if (prevProject.get(key) != currentProject.get(key)) {
                    prevState[key] = prevProject.get(key)
                }
            }
        }
    })
    return prevState;
}

const createNotification = (res: Response, user: { name: string, _id: string }, currentProject: IProject, method: string, prevProject: IProject) => {
    return new Promise<void>((resolve, reject) => {
        const oldParticipants = currentProject ? currentProject.participants : [];
        const recipients = [...currentProject.participants, ...oldParticipants].filter((eachParticipant) => { return eachParticipant.toString() != user._id.toString() })
        let notification = new Notification({ project: currentProject._id, task: null, type: 'Project', modelName: 'Project', userFrom: user._id, usersTo: recipients.map((p) => { return { checked: false, user: p } }), method: method, date: new Date().getTime(), item: currentProject._id, oldItem: {name:prevProject.name,_id:prevProject._id} })
        postNotification(res, notification).then((notificationToSend: INotification) => {
            socketUsersList.broadcastToGroup(user._id, notificationToSend, 'notification', [...recipients.map((p) => { return p.toString() })]);
            resolve();
        });
    });
};

const broadcastProjectEvent = (userId: string, project: IProject, method: string, prevProject?: IProject) => {
    const oldParticipants = prevProject ? prevProject.participants : [];
    const recipients = [...project.participants, ...oldParticipants].filter((eachParticipant) => { return eachParticipant.toString() != userId.toString() }).map((e) => { return e.toString() })
    socketUsersList.broadcastToGroup(userId, { project, method }, 'projects-events', recipients);
};




