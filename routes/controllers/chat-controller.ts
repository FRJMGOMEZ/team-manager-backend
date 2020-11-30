


/* const sendMessage = ()=>{
    
} */

/* export const getMessages = (req: Request, res: Response) => {

    let projectId = String(req.query.projectId);
    let from = Number(req.query.from);
    let limit = Number(req.query.limit)

    Message.countDocuments({ project: new mongoose.Types.ObjectId(projectId) }, (err, count: number) => {

        if (err) {
            return res.status(500).json({ ok: false, err })
        }
        Message.find({ project: new mongoose.Types.ObjectId(projectId) })
            .sort({ date: -1 })
            .skip(from)
            .limit(limit)
            .populate({
                path: 'user',
                model: 'User',
                select: 'user name _id'
            })
            .populate('files')
            .exec((err, messagesDb) => {

                if (err) {
                    return res.status(500).json({ ok: false, err })
                }
                if (!messagesDb) {

                    return res.status(404).json({ ok: false, message: 'There are no messages in the project' })
                }
                res.status(200).json({ ok: true, messages: messagesDb, count })
            })
    })
} */


/* export const getMessagesToCheck = (req: Request, res: Response) => {

    let userOnline = req.body.user.userDb;
    let requests: Promise<IMessage[]>[] = [];
    User.findById(userOnline._id, (err, userDb: IUser) => {
        if (err) {
            return res.status(500).json({ ok: false, err })
        }
        if (!userDb) {
            return res.status(404).json({ ok: false, message: 'There are no users with the ID provided' })
        }

        Box.findById(userDb.box, (err: Error, boxDb: IBox) => {

            if (err) {
                return res.status(500).json({ ok: false, err })
            }
            if (!boxDb) {
                return res.status(404).json({ ok: false, message: 'There are no boxes with the ID provided' })
            }

            boxDb.projects.forEach((project) => {
                requests.push(findMessages(res, project._id, project.lastConnection))
            })

            if (requests.length === 0) {
                return res.status(200).json({ ok: true, messages: [] })
            } else {

                Promise.all(requests).then((responses: any[]) => {

                    let messages: IMessage[] = []

                    responses.forEach((response) => {
                        response.forEach((message: IMessage) => {
                            messages.push(message)
                        })
                    })
                    res.status(200).json({ ok: true, messages })
                })
            }
        })
    })
} */


/* const findMessages = (res: Response, projectId: mongoose.Types.ObjectId, userLastConnection: number): Promise<IMessage[]> => {
    return new Promise((resolve, reject) => {

        if (userLastConnection === null) { resolve() } else {

            Message.find({ project: projectId, date: { $gte: userLastConnection } })
                .populate('project', 'name _id')
                .exec((err, messages: IMessage[]) => {
                    if (err) {
                        reject(res.status(500).json({ ok: false, err }))
                    }
                    resolve(messages)
                })
        }
    })
} */


/* export const getFilesByProject = (req: Request, res: Response) => {

    let projectId = req.params.id as string;

    Message.find({ project: new mongoose.Types.ObjectId(projectId) }).populate('files').exec((err, messagesDb: IMessage[]) => {
        if (err) {
            return res.status(500).json({ ok: false, err })
        }
        let files: IFile[] = [];
        messagesDb.forEach((message: IMessage) => {
            files.push(...message.files as IFile[])
        })
        res.status(200).json({ ok: true, files })
    })
} */

/* export const postMessage = (req: Request, res: Response) => {
  
    let message = new Message({
        user: req.body.user.userDb._id as mongoose.Types.ObjectId,
        project: req.body.project as mongoose.Types.ObjectId,
        text: req.body.text,
        files: req.body.files as mongoose.Types.ObjectId[],
        date: new Date().getTime()
    })
    message.save((err: Error) => {
        if (err) {
            return res.status(500).json({ ok: false, err })
        }
        message.populate({
            path: 'user',
            model: 'User',
            select: 'name email _id'
        }).populate({ path: 'files' }, (err: Error, messageDb: IMessage) => {
            if (err) {
                return res.status(500).json({ ok: false, err })
            }
            Project.findByIdAndUpdate(message.project, { $push: { messages: messageDb._id } })
                .exec((err, projectDb: IProject) => {
                    if (err) {
                        return res.status(500).json({ ok: false, err })
                    }
                    if (!projectDb) {
                        res.status(404).json({ ok: false, message: 'There are no projects with the ID provided' })
                    }
                    res.status(200).json({ ok: true, message: messageDb })
                })
        })
    })
} */


/* export const deleteMessage = (req:Request,res:Response)=>{

        let id = req.params.id;

        Message.findByIdAndDelete(id).exec((err:Error, messageDeleted:IMessage) => {
            if (err) {
                return res.status(500).json({ ok: false, err })
            }
            if (!messageDeleted) {
                return res.status(404).json({ ok: false, message: 'There are no messages with the ID provided' })
            }
            Project.updateOne({ messages: messageDeleted._id }, { $pull: { messages: messageDeleted._id } }, { new: true }, (err, projectUpdated:IProject) => {
                if (err) {
                    return res.status(500).json({
                        ok: false,
                        err
                    });
                }

                if (!projectUpdated) {
                    return res.status(404).json({ ok: false, message: 'There are no projects with the message provided' })
                }

                res.status(200).json({ ok: true, message: messageDeleted })
            })
        })
} */

/* export const getMessagesSaved = (req:Request,res:Response)=>{

        let userOnline = req.body.user.userDb;
        let projectId = req.query.projectId;

        Box.findById(userOnline.box)
            .populate({
                path: 'messages',
                model: 'Message',
                match: {
                    project: projectId
                },
                populate: [
                    { path: 'files', model: 'FileModel' },
                    { path: 'user', model: 'User' }
                ]
            })
            .exec((err, boxDb:IBox) => {
                if (err) {
                    return res.status(500).json({ ok: false, err })
                }
                if (!boxDb) {
                    return res.status(404).json({ ok: false, message: 'There are no boxes with the ID provided' })
                }
                let messages = boxDb.messages;
                res.status(200).json({ ok: true, messages })
            })
} */


/* export const saveMessage = (req: Request, res: Response)=>{

        let userOnline = req.body.user.userDb;
        let messageId = req.params.id as string;

        Box.findByIdAndUpdate(userOnline.box, { $push: { messages: new mongoose.Types.ObjectId(messageId) } })
        .exec((err, boxSaved:IBox) => {
            if (err) {
                return res.status(500).json({ ok: false, err })
            }
            if (!boxSaved) {
                return res.status(404).json({ ok: false, message: 'There are no boxes with the ID provided' })
            }
            res.status(200).json({ ok: true })
        })
} */

/* export const searchMessage = (req: Request, res: Response) => {

    let input = req.params.input;
    let projectId = req.query.projectId;
    let userOnline = req.body.user.userDb;

    let regExp = new RegExp(input, "i");

    Box.findById(userOnline.box).populate(
        {
            path: 'messages',
            model: 'Message',
            match: {
                text: regExp,
                project: projectId
            },
            populate: [
                { path: 'files', model: 'FileModel' },
                { path: 'user', model: 'User' }
            ]
        }

    ).exec((err:Error, boxDb:IBox) => {

        if (err) {
            return res.status(500).json({ ok: false, err })
        }
        if (!boxDb) {
            return res.json(404).json({ ok: false, message: 'No boxes have been found' })
        }

        let regExpHTML = /<([a-z0-6]+)([^<]+)*(?:>(.*)<\/\1>|\s+\/>)/ ;

        let messages = (boxDb.messages as IMessage[]).map((message:IMessage) => {
            message.text = message.text.split('&nbsp').join('');
            return message.text.match(regExpHTML)
        })

        res.status(200).json({ ok: true, messages })
    })
} */


/* export const removeMessageFromBox = (req: Request, res: Response) =>{
        let userOnline = req.body.user.userDb;
        let messageId = req.params.id;

        Box.findByIdAndUpdate(userOnline.box, { $pull: { "messages": messageId } }, (err:Error) => {
            if (err) {
                return res.status(500).json({ ok: false, err })
            }
            res.status(200).json({ ok: true })
        })
} */


