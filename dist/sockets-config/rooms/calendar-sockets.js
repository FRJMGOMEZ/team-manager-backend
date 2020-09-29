"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.joinCalendar = void 0;
const main_sockets_1 = require("../main-sockets");
exports.joinCalendar = (client) => {
    client.on(`user-in-calendar`, (payload) => {
        //// the id is formed by:  'calendar' - projectId - startDate - endDate  ///
        let { roomId } = payload;
        main_sockets_1.socketUsersList.joinRoom(client, { name: 'calendar', id: roomId }, false);
    });
};
