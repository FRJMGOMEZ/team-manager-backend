import { IUser } from '../../models/user.model';
import ActionRequired from '../../models/action-required.model';
import { Response } from 'express'

export const setActionRequired = (res:Response,itemDb: any, property: string, options: string[],user:IUser,type:string) => {
    return new Promise((resolve,reject)=>{
        const actionRequired = new ActionRequired({ usersTo: itemDb.reviewers, userFrom: user._id, property, options, currentValue: itemDb.get(property),item:{ name: itemDb.name, type, _id: itemDb._id} });
        actionRequired.save((err, actionRequiredDb) => {
            if (err) {
                reject(res.status(500).json({ ok: false, err }))
            }
            !itemDb.actionsRequired ? itemDb.actionsRequired = [actionRequired] : itemDb.actionsRequired.push(actionRequired);
            resolve(itemDb);
        })
    })
}

export const removeActionRequired = (res:Response,itemDb: any, property: string) => {
    return new Promise((resolve,reject)=>{
        const actionR = itemDb.actionsRequired.find((ar: any) => { return ar.property === property });
        if(actionR){
            ActionRequired.findByIdAndDelete(actionR._id, (err, actionRequiredDb) => {
                if (err) {
                    reject(res.status(500).json({ ok: false, err }))
                }
                itemDb.actionsRequired = itemDb.actionsRequired.filter((ar: any) => { return ar.property !== property });
                resolve(itemDb);
            })
        }else{
            
            resolve(itemDb);
        }
    })
}

/* 
0x4874f858dfd71620b3b291fea7f7792ae0c2d82d
*/