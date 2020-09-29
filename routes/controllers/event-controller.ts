
import { Request, Response } from 'express'
import EventModel from '../../models/event.model';
import { IEventModel } from '../../models/event.model';
import { SocketUsersList } from '../../sockets-config/socket-users-list';
import { IUser } from '../../models/user.model';


/////  escribir una relación entre eventos y pages, porque por ejemplo el dashboard también necesita escuchar los cambios en los eventos //////

const socketUsersList = SocketUsersList.instance;
const broadcastEventsChange = (userId: string, payload: { event: IEventModel, method: string, user: string, eventOld?: IEventModel}) => {  
    console.log({userId,payload})
    socketUsersList.broadcast(userId,payload,'events-change') 
}

export const postEvent = (req: Request, res: Response) => {


    let body = req.body;
    let event = new EventModel({
        name: body.name,
        description: body.description,
        user: body.user,
        participants: body.participants,
        project: body.project ? body.project : null,
        startDate: body.startDate,
        endDate: body.endDate,
        recursive: body.recursive,
        startTime: body.startTime,
        endTime: body.endTime,
    })

    event.save((err, eventSaved) => {
        if (err) {
            return res.status(500).json({ ok: false, err })
        }
        res.status(200).json({ ok: true, event: eventSaved })


        let user: IUser = req.body.user;
        broadcastEventsChange(user._id, { event: eventSaved ,method:'POST',user:user.name})
    })
}

export const getEventsByTimeRange = (req: Request, res: Response) => {

    const from: number = Number(req.query.from);
    const to: number = Number(req.query.to);
    let user:IUser = req.body.user;
    const selector = req.params.selector;
    let query = {};
    let projectId = req.query.projectId;

    switch(selector){
        case 'day': query = {startDate:{$lte:to},endDate:{$gte:to},project:projectId};
        break;
        case 'month': query = { startDate: { $gte: from }, endDate: { $lte: to }, project: projectId};
        break;
    }
   
    let recursiveFilter = Number(req.query.recursiveFilter);


    EventModel.find(query, (err: Error, eventsDb: IEventModel[]) => {
        if (err) {
            return res.status(500).json({ ok: false, err })
        }
        eventsDb = recursiveFilter ? eventsDb.filter((eachEvent)=>{ return !eachEvent.recursive || (new Date(eachEvent.startDate).getDay() === new Date(recursiveFilter).getDay()); }):eventsDb;
        eventsDb = user.role === 'ADMIN_ROLE' ? eventsDb : eventsDb.filter((eachEvent)=>{ return (eachEvent.participants.includes(user._id.toString())) })
        console.log()
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
                console.log({err})
                return res.status(500).json({ ok: false, err })
            }
            if(!eventDb){
                return res.status(404).json({ok:false,message:'No user has been found with the ID provided'})
            }
            res.status(200).json({ ok: true, event: eventDb })
        })
}


export const putEvent = (req:Request,res:Response)=>{  

    console.log(req.body)

    let body= req.body;

    let id = req.params.id;
 
    EventModel.findByIdAndUpdate(id,{...body})
        .exec((err,eventDb)=>{
        if(err){
            return res.status(500).json({ok:false,err})
        }
        if(!eventDb){
            return res.status(404).json({ok:true,message:'No Event has been found with the ID provided'})
        }
        let user: IUser = req.body.user;
        EventModel.findById(id,(err,eventUpdated:IEventModel)=>{
            if (err) {
                return res.status(500).json({ ok: false, err })
            }
            res.status(200).json({ ok: true, event: eventUpdated })
            broadcastEventsChange(user._id, { event: eventUpdated, method: 'PUT', user: user.name, eventOld:eventDb })
        })
    })
}

export const toggleEventStatus  = (req:Request,res:Response)=>{
    let status= req.body.status;
    let eventId = req.params.id;
    EventModel.findByIdAndUpdate(eventId,{status},{new:true},(err,eventUpdated)=>{
        if (err) {
            return res.status(500).json({ ok: false, err })
        } 
        if (!eventUpdated) {
            return res.status(404).json({ ok: true, message: 'No Event has been found with the ID provided' })
        }
        res.status(200).json({ ok: true, event: eventUpdated })   
    }) 
}

export const deleteEvent = (req:Request,res:Response)=>{

    let id = req.params.id;

    EventModel.findByIdAndDelete(id,(err,eventDeleted)=>{
        if (err) {
            return res.status(500).json({ ok: false, err })
        }
        if (!eventDeleted) {
            return res.status(404).json({ ok: true, message: 'No Event has been found with the ID provided' })
        }
        res.status(200).json({ok:true,event:eventDeleted})

        let user: IUser = req.body.user;
        broadcastEventsChange(user._id, { event: eventDeleted, method: 'PUT', user: user.name })
    })

}
