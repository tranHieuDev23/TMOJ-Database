import mongoose from "mongoose";
import { env } from "../../util/env";

mongoose.connect(env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useCreateIndex: true,
    useFindAndModify: false,
    dbName: env.MONGODB_DB,
});

const connection = mongoose.connection;
connection.on("open", () => {
    console.log("Connected to MongoDB database successfully!");
});
connection.on("error", () => {
    console.error("Connection error to MongoDB database");
});

export default mongoose;
