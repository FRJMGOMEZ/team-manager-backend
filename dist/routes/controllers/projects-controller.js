"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.setPrevState = exports.deleteProject = exports.getParticipants = exports.putProject = exports.postProject = exports.getProjectById = exports.getProjects = void 0;
const project_model_1 = __importDefault(require("../../models/project.model"));
const user_model_1 = __importDefault(require("../../models/user.model"));
const task_model_1 = __importDefault(require("../../models/task.model"));
const socket_users_list_1 = require("../../sockets-config/socket-users-list");
const notification_model_1 = __importDefault(require("../../models/notification.model"));
const notification_controller_1 = require("./notification-controller");
const PREV_VERSION_SKIP_PROPERTIES = ['actionsRequired', '_id'];
const socketUsersList = socket_users_list_1.SocketUsersList.instance;
exports.getProjects = (req, res) => {
    let userOnline = req.body.userInToken;
    project_model_1.default.find({ participants: userOnline._id })
        .populate({ path: 'participants', model: 'User', select: 'name _id' })
        .populate({ path: 'administrators', model: 'User', select: 'name _id' })
        .populate({ path: 'createdBy', model: 'User', select: 'name _id' })
        .exec((err, projectsDb) => {
        if (err) {
            return res.status(500).json({ ok: false, err });
        }
        if (!projectsDb) {
            return res.status(200).json({ ok: true, projects: [] });
        }
        projectsDb.forEach((eachProject) => {
            if (eachProject.administrators.indexOf(userOnline._id) < 0 && eachProject.status === false) {
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
        .populate('createdBy')
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
    let user = req.body.userInToken;
    let project = new project_model_1.default({
        name: body.name,
        createdBy: user._id,
        participants: body.participants,
        administrators: body.administrators,
    });
    project.save((err, projectSaved) => {
        if (err) {
            return res.status(500).json({ ok: false, err });
        }
        project.populate({ path: 'participants', model: 'User', select: 'name _id' })
            .populate({ path: 'createdBy', model: 'User', select: 'name _id' })
            .populate({ path: 'administrators', model: 'User', select: 'name _id' }).execPopulate().then((projectSaved) => {
            res.status(200).json({ project: projectSaved });
            createNotification(res, { name: user.name, _id: user._id }, projectSaved, 'POST', projectSaved).then(() => {
                broadcastProjectEvent(user._id, projectSaved, 'POST', projectSaved);
            });
        });
    });
};
exports.putProject = (req, res) => {
    const project = req.body.project;
    const id = req.params.id;
    project_model_1.default.findByIdAndUpdate(id, Object.assign({}, project), { new: false })
        .populate({ path: 'participants', model: 'User', select: 'name _id' })
        .populate({ path: 'administrators', model: 'User', select: 'name _id' })
        .exec((err, projectDb) => {
        if (err) {
            return res.status(500).json({ ok: false, err });
        }
        if (!projectDb) {
            return res.status(404).json({ ok: false, message: 'There are no projects with the ID provided' });
        }
        console.log({ projectDb });
        project_model_1.default.findById(projectDb._id)
            .populate({ path: 'participants', model: 'User', select: 'name _id' })
            .populate({ path: 'administrators', model: 'User', select: 'name _id' })
            .exec((err, projectUpdated) => {
            let user = req.body.userInToken;
            exports.setPrevState(res, projectUpdated, projectDb, user).then((projectUpdated) => {
                createNotification(res, { name: user.name, _id: user._id }, projectUpdated, 'PUT', projectDb).then(() => {
                    broadcastProjectEvent(user._id, projectUpdated, 'PUT', projectDb);
                    res.status(200).json({ ok: true, project: projectUpdated });
                });
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
exports.deleteProject = (req, res) => {
    let id = req.params.id;
    project_model_1.default.findByIdAndDelete(id)
        .exec((err, projectDeleted) => {
        if (err) {
            return res.status(500).json({ ok: false, err });
        }
        if (!projectDeleted) {
            return res.status(404).json({ ok: false, message: 'There are no projects with the ID provided' });
        }
        deleteTasks(projectDeleted._id, res).then(() => {
            res.status(200).json({ ok: true, project: projectDeleted });
            let user = req.body.userInToken;
            createNotification(res, { name: user.name, _id: user._id }, projectDeleted, 'DELETE', projectDeleted).then(() => {
                broadcastProjectEvent(user._id, projectDeleted, 'DELETE');
            });
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
            resolve('');
        });
    });
};
exports.setPrevState = (res, currentProject, prevProject, user) => {
    return new Promise((resolve, reject) => {
        let prevState = calculatePrevState(currentProject, prevProject, user);
        project_model_1.default.findByIdAndUpdate(currentProject._id, { $push: { prevStates: prevState } }, { new: true })
            .populate({ path: 'participants', model: 'User', select: 'name _id' })
            .populate({ path: 'administrators', model: 'User', select: 'name _id' })
            .populate({ path: 'createdBy', model: 'User', select: 'name _id' })
            .exec((err, projectUpdated) => {
            if (err) {
                reject(res.status(500).json({ ok: false, err }));
            }
            if (!projectUpdated) {
                reject(res.status(404).json({ ok: false, message: 'There are no tasks with the ID provided' }));
            }
            resolve(projectUpdated);
        });
    });
};
const calculatePrevState = (currentProject, prevProject, user) => {
    let prevState = { user: { name: user.name, _id: user._id }, date: new Date().getTime(), changes: {} };
    console.log({ currentProject, prevProject });
    Object.keys(currentProject._doc).forEach((key) => {
        if ((key === 'participants' || key === 'administrators') && (JSON.stringify(prevProject.get(key)) != JSON.stringify(currentProject.get(key)))) {
            prevState.changes[key] = prevProject[key].map((u) => { return { _id: u._id, name: u.name }; });
        }
        else if (!PREV_VERSION_SKIP_PROPERTIES.includes(key)) {
            if (JSON.stringify(prevProject.get(key)) != JSON.stringify(currentProject.get(key))) {
                prevState.changes[key] = prevProject.get(key);
            }
        }
    });
    return prevState;
};
const createNotification = (res, user, currentProject, method, prevProject) => {
    return new Promise((resolve, reject) => {
        const oldParticipants = currentProject ? currentProject.participants : [];
        let recipients = [...currentProject.participants, ...oldParticipants].filter((eachParticipant) => { return eachParticipant._id.toString() != user._id.toString(); }).map((p) => { return p._id; });
        recipients = [...new Set(recipients)];
        let notification = new notification_model_1.default({ project: currentProject._id, task: null, type: 'Project', modelName: 'Project', userFrom: user._id, usersTo: recipients.map((p) => { return { checked: false, user: p }; }), method: method, date: new Date().getTime(), item: currentProject._id, prevItem: { name: prevProject.name, _id: prevProject._id } });
        notification_controller_1.postNotification(res, notification).then((notificationToSend) => {
            socketUsersList.broadcastToGroup(user._id, notificationToSend, 'notification', recipients.map((p) => { return p.toString(); }), true);
            resolve();
        });
    });
};
const broadcastProjectEvent = (userId, project, method, prevProject) => {
    const oldParticipants = prevProject ? prevProject.participants : [];
    const recipients = [...project.participants, ...oldParticipants].filter((eachParticipant) => { return eachParticipant._id.toString() != userId.toString(); }).map((e) => { return e._id.toString(); });
    socketUsersList.broadcastToGroup(userId, { project, method, prevProject }, 'projects-events', recipients);
};
//# sourceMappingURL=projects-controller.js.map