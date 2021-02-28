export class PrevState {

    constructor(
        public user: {
            name: string,
            _id: string
        },
        public date: number,
        public changes:{[key:string]:any}

    ){}
      
}