

import { Router } from 'express';

import { login, checkToken, refreshToken } from './controllers/auth-controller';
import { postUser, getUsers } from './controllers/users-controller';
import { verifyStatus, verifyToken} from './middlewares/auth';
import fileUpload from 'express-fileupload'
import { getBackFile, getAwsFile, postFile, removeFile } from './controllers/files-controller';
import { getProjects, postProject, putProject, getParticipants, deleteProject, getProjectById } from './controllers/projects-controller';
import { checkDemo } from './middlewares/demo';
import { getMessages, getMessagesToCheck, getFilesByProject, postMessage, deleteMessage, getMessagesSaved, saveMessage, searchMessage, removeMessageFromBox } from './controllers/chat-controller';
import { forgotPassword, setNewPassword } from './controllers/password.controller';
import { postEvent, getEventsByTimeRange, getEventById, putEvent, deleteEvent } from './controllers/event-controller';
import { toggleNotification, getNotifications } from './controllers/notification-controller';
export const router = Router();

router.use(fileUpload());

//// AUTH  ///
router.post('/login', verifyStatus, login)
router.post('/user', postUser)
router.get('/check-token', checkToken)
router.get('/refresh-token',refreshToken)


router.get('/users', [verifyToken], getUsers)


router.get('/files/:type/:fileName', getBackFile)
router.get('/get-aws-file/:name', getAwsFile)
router.put('/upload-file/:download', postFile)
router.delete('/delete-file/:fileId', removeFile)

//// PROJECTS ////
router.get('/projects', verifyToken,getProjects)
router.get('/project/:id',verifyToken,getProjectById)
router.post('/project', [verifyToken],postProject)
router.put('/project', [verifyToken],putProject)
router.delete('/project/:id', [checkDemo, verifyToken],deleteProject)
router.get('/getParticipants/:id',verifyToken,getParticipants)


///// NOTIFICATIONS /////
router.patch('/notification/:id',verifyToken,toggleNotification)
router.get('/notifications/:userId',verifyToken,getNotifications)

router.get('/messages', verifyToken,getMessages)
router.get('/messages-to-check', verifyToken,getMessagesToCheck)
router.get('/project-files/:id', verifyToken,getFilesByProject)
router.post('/message', verifyToken, postMessage)
router.delete('/message/:id', verifyToken,deleteMessage)
router.get('/messages-saved', verifyToken,getMessagesSaved)
router.put('/save-message/:id', verifyToken,saveMessage)
router.get('/search-message/:input', verifyToken,searchMessage)
router.put('/remove-message/:id', verifyToken, removeMessageFromBox)
router.put('/forgotPassword/:email',forgotPassword)
router.put('/setNewPassword/:email/:resetCode/:newPassword', setNewPassword)

///// EVENTS /////
router.post('/event',[verifyToken],postEvent)
router.get('/events-by-time-range/:selector',[verifyToken],getEventsByTimeRange)
router.get('/event-by-id/:id',verifyToken, getEventById)
router.patch('/event/:id',[verifyToken],putEvent)
router.delete('/event/:id',[verifyToken],deleteEvent)
 export default router;