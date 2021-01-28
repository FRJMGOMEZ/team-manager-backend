
import * as mailjet from "node-mailjet";
class Mail {
    constructor(
        public to?: string,
        public subject?: string,
        public message?: string) { }
    sendMail() {
        return new Promise((resolve, reject) => {
            const requestObject = {
                Messages: [{
                    From: {
                        Email: 'frjmartinezgomez@gmail.com',
                        Name: 'FRJMGOMEZ'
                    },
                    To: [{
                        Email: 'frjmartinezgomez@gmail.com',
                        Name: 'YO'
                    }],
                    Subject: this.subject,
                    TextPart: this.message
                }]
            };
            mailjet.connect(process.env.MAILJETUSER, process.env.MAILJETPASSWORD).post('send', { 'version': 'v3.1' }).request(requestObject).then(() => {
                resolve(true)
            }).catch((err) => {
                reject(err)
            })
        })
    }
}

export default new Mail;