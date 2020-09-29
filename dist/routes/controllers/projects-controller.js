"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteProject = exports.getParticipants = exports.putProject = exports.postProject = exports.getProjectById = exports.getProjects = void 0;
const project_model_1 = __importDefault(require("../../models/project.model"));
const user_model_1 = __importDefault(require("../../models/user.model"));
const box_model_1 = __importDefault(require("../../models/box.model"));
const aws_bucket_1 = require("../../services/aws-bucket");
const event_model_1 = __importDefault(require("../../models/event.model"));
const message_model_1 = __importDefault(require("../../models/message.model"));
const task_model_1 = __importDefault(require("../../models/task.model"));
const socket_users_list_1 = require("../../sockets-config/socket-users-list");
const AWSCrud = aws_bucket_1.AwsBucket.instance;
const socketUsersList = socket_users_list_1.SocketUsersList.instance;
const emitProjectChange = (userId, payload) => {
    socketUsersList.emit(userId, payload, 'projects-change');
};
exports.getProjects = (req, res) => {
    let userOnline = req.body.user;
    project_model_1.default.find({ participants: userOnline._id })
        .exec((err, projectsDb) => {
        if (err) {
            return res.status(500).json({ ok: false, err });
        }
        if (!projectsDb) {
            return res.status(200).json({ ok: true, projects: [] });
        }
        projectsDb.forEach((eachProject) => {
            if (eachProject.administrators.indexOf(userOnline._id) < 0 &&
                eachProject.status === false) {
                projectsDb = projectsDb.filter((project) => { return project._id != eachProject._id; });
            }
        });
        res.status(200).json({ ok: true, projects: projectsDb });
    });
};
exports.getProjectById = (req, res) => {
    let id = req.params.id;
    project_model_1.default.findById(id)
        .populate('administrators')
        .populate('participants')
        .exec((err, projectDb) => {
        if (err) {
            return res.status(500).json({ ok: false, err });
        }
        if (!projectDb) {
            return res.status(200).json({ ok: true, message: 'No project has been found with the ID provided' });
        }
        res.status(200).json({ ok: true, project: projectDb });
    });
};
exports.postProject = (req, res) => {
    let body = req.body;
    let project = new project_model_1.default({
        name: body.name,
        participants: body.participants,
        administrators: body.administrators,
    });
    project.save((err, projectSaved) => {
        if (err) {
            return res.status(500).json({ ok: false, err });
        }
        let requests = [];
        let newProject = { _id: projectSaved._id, lastConnection: new Date().getTime() };
        projectSaved.participants.forEach((eachParticipant) => {
            requests.push(addProjectToParticipant(res, eachParticipant.toString(), newProject));
        });
        Promise.all(requests).then(() => {
            res.status(200).json({ project: projectSaved });
            let user = req.body.user;
            emitProjectChange(user._id, { project: projectSaved, method: 'POST', user: user.name });
        });
    });
};
exports.putProject = (req, res) => {
    let body = req.body;
    project_model_1.default.findByIdAndUpdate(body._id, { name: body.name, description: body.description, administrators: body.administrators, participants: body.participants })
        .exec((err, projectDb) => {
        if (err) {
            return res.status(500).json({ ok: false, err });
        }
        if (!projectDb) {
            return res.status(404).json({ ok: false, message: 'There are no projects with the ID provided' });
        }
        let newProject = { _id: projectDb._id, lastConnection: new Date().getTime() };
        let requests = [Promise.resolve()];
        let projectDbParticipants = (projectDb.participants).map((participant) => { return participant.toString(); });
        let participantsAddRequests = body.participants.filter((participant) => { return !projectDbParticipants.includes(participant); }).map((participantToAdd) => { return addProjectToParticipant(res, participantToAdd, newProject); });
        let participantsRemoveRequests = projectDbParticipants.filter((participant) => { return !body.participants.includes(participant); }).map((participantToRemove) => { return removeProjectToParticipant(res, participantToRemove, projectDb._id); });
        requests.push(...participantsAddRequests, ...participantsRemoveRequests);
        Promise.all(requests).then(() => {
            body._id = projectDb._id;
            res.status(200).json({ ok: true, project: body });
        });
    });
};
const addProjectToParticipant = (res, userId, newProject) => {
    return new Promise((resolve, reject) => {
        user_model_1.default.findById(userId, (err, userDb) => {
            if (err) {
                reject(res.status(500).json({ ok: false, err }));
            }
            if (!userDb) {
                reject(res.status(404).json({ ok: false, message: 'No user has been found' }));
            }
            box_model_1.default.findByIdAndUpdate(userDb.box, { $push: { projects: newProject } }).exec((err, boxUpdated) => {
                if (err) {
                    reject(res.status(500).json({ ok: false, err }));
                }
                if (!boxUpdated) {
                    reject(res.status(404).json({ ok: false, message: 'No box has been found' }));
                }
                resolve();
            });
        });
    });
};
const removeProjectToParticipant = (res, userId, projectId) => {
    return new Promise((resolve, reject) => {
        user_model_1.default.findById(userId, (err, userDb) => {
            if (err) {
                reject(res.status(500).json({ ok: false, err }));
            }
            if (!userDb) {
                reject(res.status(404).json({ ok: false, message: 'No user has been found' }));
            }
            box_model_1.default.findByIdAndUpdate(userDb.box, { $pull: { 'projects': { '_id': projectId } } })
                .exec((err, boxUpdated) => {
                if (err) {
                    reject(res.status(500).json({ ok: false, err }));
                }
                if (!boxUpdated) {
                    reject(res.status(404).json({ ok: false, message: 'No box has been found' }));
                }
                resolve();
            });
        });
    });
};
exports.getParticipants = (req, res) => {
    let projectId = req.params.id;
    project_model_1.default.findById(projectId).distinct('participants').exec((err, participantsDb) => {
        if (err) {
            return res.status(500).json({ ok: false, message: err });
        }
        user_model_1.default.find({ '_id': participantsDb }).exec((err, usersDb) => {
            if (err) {
                return res.status(500).json({ ok: false, message: err });
            }
            res.status(200).json({ ok: true, participants: usersDb });
        });
    });
};
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
exports.deleteProject = (req, res) => {
    let id = req.params.id;
    project_model_1.default.findByIdAndDelete(id)
        .exec((err, projectDeleted) => {
        if (err) {
            console.log({ err });
            return res.status(500).json({ ok: false, err });
        }
        if (!projectDeleted) {
            return res.status(404).json({ ok: false, message: 'There are no projects with the ID provided' });
        }
        let promises = [];
        /* DELETING EVENTS LINKED WITH THIS PROJECT */
        event_model_1.default.find({ project: projectDeleted._id }, (err, eventsDb) => {
            if (err) {
                return res.status(500).json({ ok: false, err });
            }
            let eventsIds = eventsDb.map((event) => { return event._id; });
            eventsIds.forEach((id) => {
                promises.push(removeProjectFromEvent(res, id));
            });
            /*  DELETING MESSAGES OF PROJECT */
            projectDeleted.messages.forEach((id) => {
                promises.push(deleteMessage(res, id));
            });
            /* UPDATING BOXES */
            box_model_1.default.find({ 'projects._id': projectDeleted._id }, (err, boxesDb) => {
                if (err) {
                    return res.status(500).json({ ok: false, err });
                }
                boxesDb.forEach((box) => {
                    promises.push(updateBox(res, box, projectDeleted._id.toString(), projectDeleted.messages));
                });
                /* DELETING PROJECT TASKS */
                promises.push(deleteProjectTasks(res, projectDeleted._id));
                Promise.all(promises).then(() => {
                    res.status(200).json({ ok: true, project: projectDeleted });
                    let user = req.body.user;
                    emitProjectChange(user._id, { project: projectDeleted, method: 'DELETE', user: user.name });
                }).catch((err) => {
                    return res.status(500).json({ ok: false, err });
                });
            });
        });
    });
};
const removeProjectFromEvent = (res, eventId) => {
    return new Promise((resolve, reject) => {
        event_model_1.default.findOneAndDelete(eventId)
            .exec((err, eventDb) => {
            if (err) {
                reject(res.status(500).json({ ok: false, err }));
            }
            if (!eventDb) {
                reject(res.status(404).json({ ok: false, message: 'No events have been found wich matches with the ID provided' }));
            }
        });
    });
};
const deleteMessage = (res, id) => {
    return new Promise((resolve, reject) => {
        message_model_1.default.findByIdAndDelete(id)
            .populate('files')
            .exec((err, messageDeleted) => {
            if (err) {
                reject(res.status(500).json({ ok: false, err }));
            }
            if (messageDeleted.files.length > 0) {
                let promises = messageDeleted.files.map((file) => { return AWSCrud.deleteFile(res, file._id); });
                Promise.all(promises).then(() => {
                    resolve(messageDeleted);
                });
            }
            else {
                resolve(messageDeleted);
            }
        });
    });
};
const updateBox = (res, boxDb, projectDeletedId, messagesToDelete) => {
    return new Promise((resolve, reject) => {
        boxDb.projects = boxDb.projects.filter((project) => { return project._id != projectDeletedId; });
        boxDb.messages = boxDb.messages.filter((message) => { return !messagesToDelete.includes(message); });
        boxDb.save((err, boxSaved) => {
            if (err) {
                reject(res.status(500).json({ ok: false, err }));
            }
            resolve();
        });
    });
};
const deleteProjectTasks = (res, projectDeletedId) => {
    return new Promise((resolve, reject) => {
        task_model_1.default.deleteMany({ project: projectDeletedId }, (err) => {
            if (err) {
                reject(res.status(500).json({ ok: false, err }));
            }
            resolve();
        });
    });
};
