

declare global {
    namespace NodeJS {
        interface ProcessEnv {
            PORT: string;
            FRONT_URL: string;
            TOKEN_SEED: string;
            TOKEN_EXP: string;
            NODE_ENV: string;
            MONGO_URI: string;
            URLDB:string;
            AWS_S3_BUCKET_NAME:string;
            AWS_ACCESS_KEY_ID: string;
            AWS_SECRET_ACCESS_KEY: string;
            MAILJETPASSWORD:string;
            MAILJETUSER:string
            
        }
    }
}


export{}