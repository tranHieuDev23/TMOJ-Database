import { Router } from "express";
import asyncHandler from "express-async-handler";
import { StatusCodes } from "http-status-codes";
import { SubmissionDao } from "../models/daos/submissions";
import { SubmissionNotFoundError } from "../models/daos/exceptions";
import { SubmissionFilterOptions, SubmissionBase } from "../models/submission";

const submissionDao = SubmissionDao.getInstance();

export const submissionRouter = Router();

submissionRouter.post(
    "/",
    asyncHandler(async (req, res) => {
        const requestedSubmission = req.body as SubmissionBase;
        const newSubmission = await submissionDao.addSubmission(
            requestedSubmission
        );
        const newUserLocation = `${req.originalUrl}${newSubmission.submissionId}`;
        res.setHeader("Location", newUserLocation);
        return res.status(StatusCodes.CREATED).json(newSubmission);
    })
);

submissionRouter.get(
    "/",
    asyncHandler(async (req, res) => {
        const filterOptions = req.body.filterOptions as SubmissionFilterOptions;
        const asUser = req.body.asUser as string;
        const submissions = await submissionDao.getSubmissionList(
            filterOptions,
            asUser
        );
        filterOptions.startIndex = 0;
        filterOptions.itemCount = null;
        const totalItemCount = await submissionDao.getSubmissionListCount(
            filterOptions,
            asUser
        );
        return res.status(StatusCodes.OK).json({ totalItemCount, submissions });
    })
);

submissionRouter.get(
    "/:submissionId",
    asyncHandler(async (req, res) => {
        const submissionId = req.params.submissionId;
        const user = await submissionDao.getSubmission(submissionId);
        if (user === null) {
            throw new SubmissionNotFoundError(submissionId);
        }
        return res.status(StatusCodes.OK).json(user);
    })
);

submissionRouter.patch(
    "/:submissionId",
    asyncHandler(async (req, res) => {
        const submissionId = req.params.submissionId;
        const requestedSubmission = req.body as SubmissionBase;
        requestedSubmission.submissionId = submissionId;
        const updatedSubmission = await submissionDao.updateSubmission(
            requestedSubmission
        );
        if (updatedSubmission === null) {
            throw new SubmissionNotFoundError(submissionId);
        }
        return res.status(StatusCodes.OK).json(updatedSubmission);
    })
);

submissionRouter.delete(
    "/:submissionId",
    asyncHandler(async (req, res) => {
        const { submissionId } = req.params;
        const deletedCount = await submissionDao.deleteSubmission(submissionId);
        if (deletedCount === 0) {
            throw new SubmissionNotFoundError(submissionId);
        }
        return res.status(StatusCodes.OK).send();
    })
);
