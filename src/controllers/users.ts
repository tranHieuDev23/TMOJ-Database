import { Router } from "express";
import asyncHandler from "express-async-handler";
import { StatusCodes } from "http-status-codes";
import { User } from "../models/user";
import { UserDao } from "../models/daos/users";
import { UserNotFoundError } from "../models/daos/exceptions";

const userDao = UserDao.getInstance();

export const userRouter = Router();

userRouter.post(
    "/",
    asyncHandler(async (req, res) => {
        const requestedUser = User.fromObject(req.body);
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
            throw new UserNotFoundError(username);
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
            throw new UserNotFoundError(username);
        }
        return res.status(StatusCodes.OK).json(user);
    })
);

userRouter.delete(
    "/:username",
    asyncHandler(async (req, res) => {
        const { username } = req.params;
        const deletedCount = await userDao.deleteUser(username);
        if (deletedCount === 0) {
            throw new UserNotFoundError(username);
        }
        return res.status(StatusCodes.OK).send();
    })
);
