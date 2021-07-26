import { Router } from "express";
import { Error } from "mongoose";
import asyncHandler from "express-async-handler";
import { StatusCodes } from "http-status-codes";
import { User } from "../models/user";
import { UserDao } from "../models/daos/users";

const userDao = UserDao.getInstance();

export const userRouter = Router();

userRouter.post(
    "/",
    asyncHandler(async (req, res) => {
        const { username, displayName } = req.body;
        const requestedUser = new User(username, displayName);
        const newUser = await userDao.addUser(requestedUser);
        const newUserLocation = `${req.originalUrl}${newUser.username}`;
        res.setHeader("Location", newUserLocation);
        return res.status(StatusCodes.CREATED).json(newUser);
    })
);

userRouter.get(
    "/:username",
    asyncHandler(async (req, res) => {
        const username = req.params.username;
        const user = await userDao.getUser(username);
        if (user === null) {
            return res.status(StatusCodes.NOT_FOUND).json({
                error: "Cannot find any user with the provided username",
            });
        }
        return res.status(StatusCodes.OK).json(user);
    })
);

userRouter.patch(
    "/:username",
    asyncHandler(async (req, res) => {
        const username = req.params.username;
        const { displayName } = req.body;
        const requestedUser = new User(username, displayName);
        const user = await userDao.updateUser(requestedUser);
        if (user === null) {
            return res.status(StatusCodes.NOT_FOUND).json({
                error: "Cannot find any user with the provided username",
            });
        }
        return res.status(StatusCodes.OK).json(user);
    })
);

userRouter.delete(
    "/:username",
    asyncHandler(async (req, res) => {
        const { username } = req.params;
        const user = await userDao.deleteUser(username);
        if (user === 0) {
            return res.status(StatusCodes.NOT_FOUND).json({
                error: "Cannot find any user with the provided username",
            });
        }
        return res.status(StatusCodes.OK).json(user);
    })
);

// Error handler
userRouter.use(async (err, req, res, next) => {
    if (err instanceof Error.ValidationError) {
        return res.status(StatusCodes.BAD_REQUEST).json({
            error: err.message,
        });
    }
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        error: "Internal server error",
    });
});
