import * as dotenv from "dotenv";
dotenv.config();

export const env = {
    MONGODB_URI: process.env.MONGODB_URI,
    MONGODB_DB: process.env.MONGODB_DB,
};