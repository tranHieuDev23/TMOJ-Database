import express from "express";
import compression from "compression";  // compresses requests
import { userRouter } from "./controllers/users";
import { authenticationDetailRouter } from "./controllers/authentication-details";
import { problemRouter } from "./controllers/problems";
import { contestRouter } from "./controllers/contests";

// Create Express server
const app = express();


// Express configuration
app.set("port", process.env.PORT || 3000);
app.use(compression());
app.use(express.json());

// Routers
app.use("/api/users", userRouter);
app.use("/api/auth", authenticationDetailRouter);
app.use("/api/problems", problemRouter);
app.use("/api/contests", contestRouter);

export default app;
