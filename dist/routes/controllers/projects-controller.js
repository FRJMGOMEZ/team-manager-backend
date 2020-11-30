"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteProject = exports.getParticipants = exports.putProject = exports.postProject = exports.getProjectById = exports.getProjects = void 0;
const project_model_1 = __importDefault(require("../../models/project.model"));
const user_model_1 = __importDefault(require("../../models/user.model"));
const aws_bucket_1 = require("../../services/aws-bucket");
const task_model_1 = __importDefault(require("../../models/task.model"));
const socket_users_list_1 = require("../../sockets-config/socket-users-list");
const AWSCrud = aws_bucket_1.AwsBucket.instance;
const socketUsersList = socket_users_list_1.SocketUsersList.instance;
const emitProjectChange = (userId, payload) => {
    socketUsersList.emit(userId, payload, 'projects-change');
};
exports.getProjects = (req, res) => {
    let userOnline = req.body.userInToken;
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
        res.status(200).json({ project: projectSaved });
        let user = req.body.userInToken;
        emitProjectChange(user._id, { project: projectSaved, method: 'POST', user: user.name });
    });
};
exports.putProject = (req, res) => {
    let body = req.body;
    let project = {
        name: body.name,
        participants: body.participants,
        administrators: body.administrators,
        status: body.status
    };
    project_model_1.default.findByIdAndUpdate(body._id, project, (err, projectDb) => {
        if (err) {
            return res.status(500).json({ ok: false, err });
        }
        if (!projectDb) {
            return res.status(404).json({ ok: false, message: 'There are no projects with the ID provided' });
        }
        body._id = projectDb._id;
        res.status(200).json({ ok: true, project: body });
        let user = req.body.userInToken;
        emitProjectChange(user._id, { project: body, method: 'PUT', user: user.name, projectOld: projectDb });
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
        deleteTasks(projectDeleted._id, res).then(() => {
            res.status(200).json({ ok: true, project: projectDeleted });
            let user = req.body.userInToken;
            emitProjectChange(user._id, { project: projectDeleted, method: 'DELETE', user: user.name });
        });
    });
};
const deleteTasks = (projectId, res) => {
    return new Promise((resolve, reject) => {
        task_model_1.default.deleteMany({ project: projectId })
            .exec((err, deletedTasks) => {
            if (err) {
                reject(res.status(500).json({ ok: false, err }));
            }
            resolve();
        });
    });
};
