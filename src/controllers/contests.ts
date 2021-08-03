import { Router } from "express";
import asyncHandler from "express-async-handler";
import { StatusCodes } from "http-status-codes";
import { ContestDao, GetContestOptions } from "../models/daos/contests";
import { AnnouncementDao } from "../models/daos/announcements";
import { ContestFilterOptions, ContestBase } from "../models/contest";
import { Announcement } from "../models/announcement";
import {
    AnnouncementNotFoundError,
    ContestNotFoundError,
} from "../models/daos/exceptions";

const contestDao = ContestDao.getInstance();
const announcementDao = AnnouncementDao.getInstance();

export const contestRouter = Router();

contestRouter.post(
    "/",
    asyncHandler(async (req, res) => {
        const requestedContest = req.body as ContestBase;
        const newContest = await contestDao.addContest(requestedContest);
        const newLocation = `${req.originalUrl}${requestedContest.contestId}`;
        res.setHeader("Location", newLocation);
        return res.status(StatusCodes.CREATED).json(newContest);
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

contestRouter.post(
    "/:contestId/announcements",
    asyncHandler(async (req, res) => {
        const contestId = req.params.contestId;
        const requestedAnnouncement = req.body as Announcement;
        const newAnnouncement = await announcementDao.addAnnouncement(
            contestId,
            requestedAnnouncement
        );
        const newLocation = `${req.baseUrl}/announcements/${newAnnouncement.announcementId}`;
        res.setHeader("Location", newLocation);
        return res.status(StatusCodes.CREATED).json(newAnnouncement);
    })
);

contestRouter.get(
    "/",
    asyncHandler(async (req, res) => {
        const filterOptions = req.body.filterOptions as ContestFilterOptions;
        const asUser = req.body.asUser as string;
        const contests = await contestDao.getContestList(filterOptions, asUser);
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

contestRouter.get(
    "/:contestId/announcements",
    asyncHandler(async (req, res) => {
        const contestId = req.params.contestId;
        const getOptions = new GetContestOptions();
        getOptions.includeAnnouncements = true;
        const contest = await contestDao.getContest(contestId, getOptions);
        if (contest === null) {
            throw new ContestNotFoundError(contestId);
        }
        return res.status(StatusCodes.OK).json(contest.announcements);
    })
);

contestRouter.get(
    "/announcements/:announcementId",
    asyncHandler(async (req, res) => {
        const announcementId = req.params.announcementId;
        const announcement = await announcementDao.getAnnouncement(
            announcementId
        );
        return res.status(StatusCodes.OK).json(announcement);
    })
);

contestRouter.patch(
    "/:contestId",
    asyncHandler(async (req, res) => {
        const contestId = req.params.contestId;
        const requestedContest = req.body as ContestBase;
        requestedContest.contestId = contestId;
        const contest = await contestDao.updateContest(requestedContest);
        if (contest === null) {
            throw new ContestNotFoundError(contestId);
        }
        return res.status(StatusCodes.OK).json(contest);
    })
);

contestRouter.patch(
    "/announcements/:announcementId",
    asyncHandler(async (req, res) => {
        const announcementId = req.params.announcementId;
        const requestedAnnouncement = req.body as Announcement;
        requestedAnnouncement.announcementId = announcementId;
        const updatedAnnouncement = await announcementDao.updateAnnouncement(
            requestedAnnouncement
        );
        if (updatedAnnouncement === null) {
            throw new AnnouncementNotFoundError(announcementId);
        }
        return res.status(StatusCodes.OK).json(updatedAnnouncement);
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

contestRouter.delete(
    "/announcements/:announcementId",
    asyncHandler(async (req, res) => {
        const announcementId = req.params.announcementId;
        const deletedCount = await announcementDao.deleteAnnouncement(
            announcementId
        );
        if (deletedCount === 0) {
            throw new AnnouncementNotFoundError(announcementId);
        }
        return res.status(StatusCodes.OK).send();
    })
);
