

import { Router } from 'express';

import { login, checkToken, refreshToken, onServerOffDisconnection} from './controllers/auth-controller';
import { postUser, getUsers } from './controllers/users-controller';
import { verifyStatus, verifyToken} from './middlewares/auth';
import fileUpload from 'express-fileupload'
import { getAwsFile, postFile, deleteFile, getTaskFiles } from './controllers/files-controller';
import { getProjects, postProject, putProject, getParticipants, deleteProject, getProjectById, userInProject } from './controllers/projects-controller';
import { checkDemo } from './middlewares/demo';
import { forgotPassword, setNewPassword } from './controllers/password.controller';
import { toggleNotification, getNotifications, getNotificationById, putNotification } from './controllers/notification-controller';
import { postTask, getTaskById, putTask, deleteTask, getTasks, userInTask } from './controllers/task-controller';
import { postMessage, getMessages } from './controllers/chat-controller';
export const router = Router();

router.use(fileUpload());

//// AUTH  ///
router.post('/login', verifyStatus, login);
router.post('/user', postUser);
router.get('/check-token', checkToken);
router.get('/refresh-token',refreshToken);
router.put('/forgot-password/:email', forgotPassword);
router.put('/set-new-password/:email/:resetCode/:newPassword', setNewPassword);
router.post('/on-server-off-disconnection/:userId',onServerOffDisconnection);

//// USERS /////
router.get('/users', verifyToken, getUsers);

//// FILES ////
router.get('/file/:name', getAwsFile);
router.put('/upload-file/:download', verifyToken, postFile);
router.delete('/delete-file/:fileId', verifyToken, deleteFile);
router.get('/task-files/:id', verifyToken, getTaskFiles);

//// PROJECTS ////
router.get('/projects', verifyToken,getProjects);
router.get('/project/:id',verifyToken,getProjectById);
router.post('/project', verifyToken,postProject);
router.put('/project/:id', verifyToken,putProject);
router.delete('/project/:id', [checkDemo, verifyToken],deleteProject);
router.get('/get-participants/:id',verifyToken,getParticipants);
router.get('/user-in-project/:projectId', verifyToken, userInProject);

///// NOTIFICATIONS /////
router.patch('/toggle-notification',verifyToken,toggleNotification);
router.get('/notifications',verifyToken,getNotifications);
router.get('/notification/:id',verifyToken,getNotificationById);
router.put('/notification/:id',verifyToken,putNotification);

///// TASKS /////

router.post('/task',verifyToken,postTask);
router.get('/tasks/:selector',verifyToken,getTasks);
router.get('/task-by-id/:id',verifyToken, getTaskById);
router.patch('/task/:id',verifyToken,putTask);
router.delete('/task/:id',verifyToken,deleteTask);
router.get('/user-in-task/:taskId/:projectId', verifyToken, userInTask);


//// MESSAGES /////
router.post('/message/:taskId',verifyToken,postMessage);
router.get('/messages/:taskId',verifyToken, getMessages);

export default router;



