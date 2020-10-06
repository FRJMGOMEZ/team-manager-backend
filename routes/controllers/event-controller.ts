
import { Request, Response } from 'express'
import EventModel from '../../models/event.model';
import { IEventModel } from '../../models/event.model';
import { SocketUsersList } from '../../sockets-config/socket-users-list';
import { IUser } from '../../models/user.model';
import { IProject } from '../../models/project.model';
import Notification from '../../models/notification.model';
import { INotification } from '../../models/notification.model';


/////  escribir una relación entre eventos y pages, porque por ejemplo el dashboard también necesita escuchar los cambios en los eventos //////

const socketUsersList = SocketUsersList.instance;
const broadcastEventsNotification = (user:IUser, currentItem: IEventModel, method: string, oldItem?: IEventModel) => {
    const oldParticipants = oldItem ? oldItem.participants : [];
    const participants = [...currentItem.participants, ...oldParticipants].filter((eachParticipant) => { return eachParticipant.toString() != user._id.toString() })
    let notification = new Notification({ type: 'EventModel', userFrom:user._id , usersTo: participants, method: method, checked: false, date: new Date().getTime(), item: currentItem._id, oldItem:oldItem ? {_id:oldItem._id,name:oldItem.name,participants:oldParticipants} : null})
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
        socketUsersList.broadcast(user._id, notificationToSend, 'events-change', (currentItem.project as IProject)._id.toString())
            
    })
}

export const postEvent = (req: Request, res: Response) => {

    let body = req.body;
    let event = new EventModel({
        name: body.name,
        description: body.description,
        user: body.userToken._id,
        participants: body.participants,
        project: body.project ? body.project : null,
        startDate: body.startDate,
        endDate: body.endDate,
        recursive: body.recursive,
        allDay: body.allDay,
        startTime: body.startTime,
        endTime: body.endTime,
    })


    event.save((err, eventSaved) => {
        if (err) {
            return res.status(500).json({ ok: false, err })
        }
        event.populate({
            path: 'project',
            model: 'Project',
            select: 'name _id'
        }, (err, eventDb) => {
            if (err) {
                return res.status(500).json({ ok: false, err })
            }
            res.status(200).json({ ok: true, event: eventDb })
        })

        let user: IUser = req.body.userToken;
        broadcastEventsNotification(user, eventSaved, 'POST')
    })
}

export const getEventsByTimeRange = (req: Request, res: Response) => {

    const from: number = Number(req.query.from);
    const to: number = Number(req.query.to);
    let user: IUser = req.body.userToken;
    const selector = req.params.selector;
    let query = {};
    let projectId = req.query.projectId;

    switch (selector) {
        case 'day': query = { startDate: { $lte: from }, endDate: { $gte: from }, project: projectId };
            break;
        case 'month': query = { startDate: { $lte: to }, endDate: { $gte: from }, project: projectId };
            break;
        case 'week': query = { startDate: { $lte: to }, endDate: { $gte: from }, project: projectId };
            break;
    }

    let recursiveFilter = Number(req.query.recursiveFilter);


    EventModel.find(query, (err: Error, eventsDb: IEventModel[]) => {
        if (err) {
            console.log({ err })
            return res.status(500).json({ ok: false, err })
        }
        eventsDb = recursiveFilter ? eventsDb.filter((eachEvent) => { return !eachEvent.recursive || (new Date(eachEvent.startDate).getDay() === new Date(recursiveFilter).getDay()); }) : eventsDb;
        eventsDb = user.role === 'ADMIN_ROLE' ? eventsDb : eventsDb.filter((eachEvent) => { return (eachEvent.participants.includes(user._id.toString())) })
        res.status(200).json({ ok: true, events: eventsDb })
    })
}


export const getEventById = (req: Request, res: Response) => {

    let id = req.params.id;

    EventModel.findById(id)
        .populate('user')
        .populate('participants')
        .populate('project')
        .exec((err, eventDb) => {
            if (err) {
                console.log({ err })
                return res.status(500).json({ ok: false, err })
            }
            if (!eventDb) {
                return res.status(404).json({ ok: false, message: 'No user has been found with the ID provided' })
            }
            res.status(200).json({ ok: true, event: eventDb })
        })
}


export const putEvent = (req: Request, res: Response) => {

    let body = req.body;

    let id = req.params.id;

    EventModel.findByIdAndUpdate(id, { ...body })
        .populate({
            path: 'project',
            model: 'Project',
            select: 'name _id'
        })
        .exec((err, eventDb) => {
            if (err) {
                return res.status(500).json({ ok: false, err })
            }
            if (!eventDb) {
                return res.status(404).json({ ok: true, message: 'No Event has been found with the ID provided' })
            }
            let user: IUser = req.body.userToken;
            EventModel.findById(id, (err, eventUpdated: IEventModel) => {
                if (err) {
                    return res.status(500).json({ ok: false, err })
                }
                console.log({eventDb})
                res.status(200).json({ ok: true, event: eventUpdated })
                broadcastEventsNotification(user, eventUpdated, 'PUT', eventDb)
            })
        })
}

export const toggleEventStatus = (req: Request, res: Response) => {
    let status = req.body.status;
    let eventId = req.params.id;
    EventModel.findByIdAndUpdate(eventId, { status }, { new: true }, (err, eventUpdated) => {
        if (err) {
            return res.status(500).json({ ok: false, err })
        }
        if (!eventUpdated) {
            return res.status(404).json({ ok: true, message: 'No Event has been found with the ID provided' })
        }
        res.status(200).json({ ok: true, event: eventUpdated })
    })
}

export const deleteEvent = (req: Request, res: Response) => {

    let id = req.params.id;

    EventModel.findByIdAndDelete(id)
        .populate({
            path: 'project',
            model: 'Project',
            select: 'name _id'
        })
        .exec((err, eventDeleted) => {
            if (err) {
                return res.status(500).json({ ok: false, err })
            }
            if (!eventDeleted) {
                return res.status(404).json({ ok: true, message: 'No Event has been found with the ID provided' })
            }
            res.status(200).json({ ok: true, event: eventDeleted })

            let user: IUser = req.body.userToken;
            console.log({eventDeleted})
            broadcastEventsNotification(user, eventDeleted, 'DELETE')
        })

}
