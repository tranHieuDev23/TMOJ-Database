import { Router } from "express";
import asyncHandler from "express-async-handler";
import { StatusCodes } from "http-status-codes";
import { BlacklistedJwt } from "../models/blacklisted-jwt";
import { BlacklistedJwtDao } from "../models/daos/blacklisted-jwts";
import { BlacklistedJwtNotFoundError } from "../models/daos/exceptions";

const blacklistedJwtDao = BlacklistedJwtDao.getInstance();

export const blacklistedJwtRouter = Router();

blacklistedJwtRouter.post(
    "/",
    asyncHandler(async (req, res) => {
        const requestedBlacklistedJwt = BlacklistedJwt.fromObject(req.body);
        const newBlacklistedJwt = await blacklistedJwtDao.addBlacklistedJwt(
            requestedBlacklistedJwt
        );
        const newBlacklistedJwtLocation = `${req.originalUrl}${newBlacklistedJwt.jwtId}`;
        res.setHeader("Location", newBlacklistedJwtLocation);
        return res.status(StatusCodes.CREATED).json(newBlacklistedJwt);
    })
);

blacklistedJwtRouter.get(
    "/:jwtId",
    asyncHandler(async (req, res) => {
        const jwtId = req.params.jwtId;
        const blacklistedJwt = await blacklistedJwtDao.getBlacklistedJwt(jwtId);
        if (blacklistedJwt === null) {
            throw new BlacklistedJwtNotFoundError(jwtId);
        }
        return res.status(StatusCodes.OK).json(blacklistedJwt);
    })
);

blacklistedJwtRouter.patch(
    "/:jwtId",
    asyncHandler(async (req, res) => {
        const jwtId = req.params.jwtId;
        const requestedBlacklistedJwt = req.body as BlacklistedJwt;
        requestedBlacklistedJwt.jwtId = jwtId;
        const blacklistedJwt = await blacklistedJwtDao.updateBlacklistedJwt(
            requestedBlacklistedJwt
        );
        if (blacklistedJwt === null) {
            throw new BlacklistedJwtNotFoundError(jwtId);
        }
        return res.status(StatusCodes.OK).json(blacklistedJwt);
    })
);

blacklistedJwtRouter.delete(
    "/:jwtId",
    asyncHandler(async (req, res) => {
        const { jwtId } = req.params;
        const deletedCount = await blacklistedJwtDao.deleteBlacklistedJwt(
            jwtId
        );
        if (deletedCount === 0) {
            throw new BlacklistedJwtNotFoundError(jwtId);
        }
        return res.status(StatusCodes.OK).send();
    })
);
