import { Router } from "express";
import asyncHandler from "express-async-handler";
import { StatusCodes } from "http-status-codes";
import {
    ContestDao,
    ContestMetadata,
    GetContestOptions,
} from "../models/daos/contests";
import { ContestFilterOptions } from "../models/contest";
import { ContestNotFoundError } from "../models/daos/exceptions";

const contestDao = ContestDao.getInstance();

export const contestRouter = Router();

contestRouter.post(
    "/",
    asyncHandler(async (req, res) => {
        const requestedContest = req.body as ContestMetadata;
        await contestDao.addContest(requestedContest);
        const newLocation = `${req.originalUrl}${requestedContest.contestId}`;
        res.setHeader("Location", newLocation);
        return res.status(StatusCodes.CREATED).send();
    })
);

contestRouter.post(
    "/:contestId/problems",
    asyncHandler(async (req, res) => {
        const contestId = req.params.contestId;
        const problemId = req.body.problemId;
        await contestDao.addContestProblem(contestId, problemId);
        return res.status(StatusCodes.OK).send();
    })
);

contestRouter.post(
    "/:contestId/participants",
    asyncHandler(async (req, res) => {
        const contestId = req.params.contestId;
        const username = req.body.username;
        await contestDao.addContestParticipant(contestId, username);
        return res.status(StatusCodes.OK).send();
    })
);

contestRouter.get(
    "/",
    asyncHandler(async (req, res) => {
        const filterOptions = req.body as ContestFilterOptions;
        const contests = await contestDao.getContestList(filterOptions);
        return res.status(StatusCodes.OK).json(contests);
    })
);

contestRouter.get(
    "/:contestId",
    asyncHandler(async (req, res) => {
        const contestId = req.params.contestId;
        const contest = await contestDao.getContest(contestId);
        if (contest === null) {
            throw new ContestNotFoundError(contestId);
        }
        return res.status(StatusCodes.OK).json(contest);
    })
);

contestRouter.get(
    "/:contestId/problems",
    asyncHandler(async (req, res) => {
        const contestId = req.params.contestId;
        const getOptions = new GetContestOptions();
        getOptions.includeProblems = true;
        const contest = await contestDao.getContest(contestId, getOptions);
        if (contest === null) {
            throw new ContestNotFoundError(contestId);
        }
        // We don't need information about test cases in problems when sending
        // with contests.
        const problems = contest.problems.map((item) => {
            delete item.testCases;
            return item;
        });
        return res.status(StatusCodes.OK).json(problems);
    })
);

contestRouter.get(
    "/:contestId/participants",
    asyncHandler(async (req, res) => {
        const contestId = req.params.contestId;
        const getOptions = new GetContestOptions();
        getOptions.includeParticipants = true;
        const contest = await contestDao.getContest(contestId, getOptions);
        if (contest === null) {
            throw new ContestNotFoundError(contestId);
        }
        return res.status(StatusCodes.OK).json(contest.participants);
    })
);

contestRouter.patch(
    "/:contestId",
    asyncHandler(async (req, res) => {
        const contestId = req.params.contestId;
        const requestedContest = req.body as ContestMetadata;
        requestedContest.contestId = contestId;
        const contest = await contestDao.updateContest(requestedContest);
        if (contest === null) {
            throw new ContestNotFoundError(contestId);
        }
        return res.status(StatusCodes.OK).json(contest);
    })
);

contestRouter.delete(
    "/:contestId",
    asyncHandler(async (req, res) => {
        const contestId = req.params.contestId;
        const deletedCount = await contestDao.deleteContest(contestId);
        if (deletedCount === 0) {
            throw new ContestNotFoundError(contestId);
        }
        return res.status(StatusCodes.OK).send();
    })
);

contestRouter.delete(
    "/:contestId/problems/:problemId",
    asyncHandler(async (req, res) => {
        const { contestId, problemId } = req.params;
        await contestDao.removeContestProblem(contestId, problemId);
        return res.status(StatusCodes.OK).send();
    })
);

contestRouter.delete(
    "/:contestId/participants/:username",
    asyncHandler(async (req, res) => {
        const { contestId, username } = req.params;
        await contestDao.removeContestParticipant(contestId, username);
        return res.status(StatusCodes.OK).send();
    })
);
