import { Router } from "express";
import asyncHandler from "express-async-handler";
import { StatusCodes } from "http-status-codes";
import {
    AuthenticationDetail,
    AuthenticationMethod,
} from "../models/authentication-detail";
import { AuthenticationDetailDao } from "../models/daos/authentication-details";
import { AuthenticationDetailNotFoundError } from "../models/daos/exceptions";

const authenticationDao = AuthenticationDetailDao.getInstance();

export const authenticationDetailRouter = Router();

authenticationDetailRouter.post(
    "/:username/",
    asyncHandler(async (req, res) => {
        const { username } = req.params;
        const detail = AuthenticationDetail.fromObject(req.body);
        await authenticationDao.addAuthenticationDetail(username, detail);
        const newLocation = `${req.originalUrl}${detail.method.valueOf()}`;
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
            throw new AuthenticationDetailNotFoundError(
                username,
                AuthenticationDetail[method]
            );
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
