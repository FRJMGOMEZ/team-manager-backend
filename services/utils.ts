const ObjectId = require('mongoose').Types.ObjectId;

export const inMongoId = (id:string)=>{
    return ObjectId.isValid(id)   
}