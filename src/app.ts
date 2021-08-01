import express from "express";
import compression from "compression"; // compresses requests
import { userRouter } from "./controllers/users";
import { authenticationDetailRouter } from "./controllers/authentication-details";
import { blacklistedJwtRouter } from "./controllers/blacklisted-jwts";
import { problemRouter } from "./controllers/problems";
import { contestRouter } from "./controllers/contests";
import { errorHandler } from "./controllers/error-handler";
import { submissionRouter } from "./controllers/submissions";
import { collectionRouter } from "./controllers/collections";
import { env } from "./util/env";

// Create Express server
const app = express();

// Express configuration
app.set("port", env.DB_SERVICE_PORT || process.env.PORT);
app.use(compression());
app.use(express.json());

// Routers
app.use("/api/users", userRouter);
app.use("/api/auth", authenticationDetailRouter);
app.use("/api/blacklisted-jwts", blacklistedJwtRouter);
app.use("/api/problems", problemRouter);
app.use("/api/contests", contestRouter);
app.use("/api/submissions", submissionRouter);
app.use("/api/collections", collectionRouter);

// Error handler for all database exceptions
app.use("/api", errorHandler);

export default app;
