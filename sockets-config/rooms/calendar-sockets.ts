import { Socket } from "socket.io"

import { socketUsersList } from '../main-sockets';

export const joinCalendar= (client: Socket) => {
    client.on(`user-in-calendar`, (payload:{roomId:string}) => {
        //// the id is formed by:  'calendar' - projectId - startDate - endDate  ///
        let {roomId} = payload;
        socketUsersList.joinRoom(client,{name:'calendar',id:roomId},false)
    })
}
