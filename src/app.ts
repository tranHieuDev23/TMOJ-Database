import express from "express";
import compression from "compression";  // compresses requests
import { userRouter } from "./controllers/user";
import { authenticationDetailRouter } from "./controllers/authentication-details";

// Create Express server
const app = express();


// Express configuration
app.set("port", process.env.PORT || 3000);
app.use(compression());
app.use(express.json());

// Routers
app.use("/api/users", userRouter);
app.use("/api/auth", authenticationDetailRouter);

export default app;
