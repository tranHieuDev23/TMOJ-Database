import * as dotenv from "dotenv";
dotenv.config();

export const env = {
    DB_SERVICE_HOST: process.env.DB_SERVICE_HOST,
    DB_SERVICE_PORT: process.env.DB_SERVICE_PORT,
    MONGODB_URI: process.env.MONGODB_URI,
    MONGODB_DB: process.env.MONGODB_DB,
};
