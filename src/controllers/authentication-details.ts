import { Router } from "express";
import { Error } from "mongoose";
import asyncHandler from "express-async-handler";
import { StatusCodes } from "http-status-codes";
import {
    AuthenticationDetail,
    AuthenticationMethod,
} from "../models/authentication-detail";
import {
    AuthenticationDetailDao,
    NoSuchAuthenticationDetailError,
    NoSuchUserError,
} from "../models/daos/authentication-details";

const authenticationDao = AuthenticationDetailDao.getInstance();

export const authenticationDetailRouter = Router();

authenticationDetailRouter.post(
    "/:username/",
    asyncHandler(async (req, res) => {
        const { username } = req.params;
        const { method, value } = req.body;
        const detail = new AuthenticationDetail(
            AuthenticationMethod[method],
            value
        );
        await authenticationDao.addAuthenticationDetail(username, detail);
        const newLocation = `${req.originalUrl}${method}`;
        res.setHeader("Location", newLocation);
        return res.status(StatusCodes.CREATED).send();
    })
);

authenticationDetailRouter.get(
    "/:username/:method",
    asyncHandler(async (req, res) => {
        const { username, method } = req.params;
        const detail = await authenticationDao.getAuthenticationDetail(
            username,
            AuthenticationMethod[method]
        );
        if (detail === null) {
            return res.status(StatusCodes.NOT_FOUND).json({
                error: "Cannot find any authentication detail for the provided user with the provided method",
            });
        }
        return res.status(StatusCodes.OK).json(detail);
    })
);

authenticationDetailRouter.patch(
    "/:username/:method",
    asyncHandler(async (req, res) => {
        const { username, method } = req.params;
        const { value } = req.body;
        const detail = new AuthenticationDetail(
            AuthenticationMethod[method],
            value
        );
        await authenticationDao.updateAuthenticationDetail(username, detail);
        return res.status(StatusCodes.OK).send();
    })
);

authenticationDetailRouter.delete(
    "/:username/:method",
    asyncHandler(async (req, res) => {
        const { username, method } = req.params;
        await authenticationDao.deleteAuthenticationDetail(
            username,
            AuthenticationMethod[method]
        );
        return res.status(StatusCodes.OK).send();
    })
);

// Error handler
authenticationDetailRouter.use(async (err, req, res, next) => {
    if (err instanceof NoSuchUserError) {
        return res.status(StatusCodes.NOT_FOUND).json({
            error: "Cannot find any user with the provided username",
        });
    }
    if (err instanceof NoSuchAuthenticationDetailError) {
        return res.status(StatusCodes.NOT_FOUND).json({
            error: "No such authentication detail was found",
        });
    }
    if (err instanceof Error.ValidationError) {
        return res.status(StatusCodes.BAD_REQUEST).json({
            error: err.message,
        });
    }
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        error: "Internal server error",
    });
});
