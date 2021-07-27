import { Router } from "express";
import { Error } from "mongoose";
import asyncHandler from "express-async-handler";
import { StatusCodes } from "http-status-codes";
import {
    NoSuchProblemError,
    NoSuchTestCaseError,
    NoSuchUserError,
    ProblemDao,
    ProblemMetadata,
} from "../models/daos/problems";
import { TestCaseDao } from "../models/daos/testcases";
import { TestCase } from "../models/testcase";

const problemDao = ProblemDao.getInstance();
const testCaseDao = TestCaseDao.getInstance();

export const problemRouter = Router();

problemRouter.post(
    "/",
    asyncHandler(async (req, res) => {
        const requestedProblem = req.body as ProblemMetadata;
        await problemDao.addProblem(requestedProblem);
        const newLocation = `${req.originalUrl}${requestedProblem.problemId}`;
        res.setHeader("Location", newLocation);
        return res.status(StatusCodes.CREATED).send();
    })
);

problemRouter.post(
    "/:problemId/testCases",
    asyncHandler(async (req, res) => {
        const problemId = req.params.problemId;
        const testCase = TestCase.fromObject(req.body);
        await testCaseDao.addTestCase(testCase);
        await problemDao.addProblemTestCase(problemId, testCase.testCaseId);
        const newLocation = `${req.baseUrl}/testCases/${testCase.testCaseId}`;
        res.setHeader("Location", newLocation);
        return res.status(StatusCodes.OK).send();
    })
);

problemRouter.get(
    "/:problemId",
    asyncHandler(async (req, res) => {
        const problemId = req.params.problemId;
        const problem = await problemDao.getProblem(problemId);
        if (problem === null) {
            return res.status(StatusCodes.NOT_FOUND).json({
                error: "Cannot find any problem with the provided problemId",
            });
        }
        return res.status(StatusCodes.OK).json(problem);
    })
);

problemRouter.get(
    "/:problemId/testCases",
    asyncHandler(async (req, res) => {
        const problemId = req.params.problemId;
        const problem = await problemDao.getProblem(problemId, true);
        if (problem === null) {
            return res.status(StatusCodes.NOT_FOUND).json({
                error: "Cannot find any problem with the provided problemId",
            });
        }
        return res.status(StatusCodes.OK).json(problem.testCases);
    })
);

problemRouter.patch(
    "/:problemId",
    asyncHandler(async (req, res) => {
        const problemId = req.params.problemId;
        const requestedProblem = req.body as ProblemMetadata;
        requestedProblem.problemId = problemId;
        const problem = await problemDao.updateProblem(requestedProblem);
        if (problem === null) {
            return res.status(StatusCodes.NOT_FOUND).json({
                error: "Cannot find any problem with the provided problemId",
            });
        }
        return res.status(StatusCodes.OK).json(problem);
    })
);

problemRouter.patch(
    "/testCases/:testCaseId",
    asyncHandler(async (req, res) => {
        const testCaseId = req.params.testCaseId;
        const requestedTestCase = req.body as TestCase;
        requestedTestCase.testCaseId = testCaseId;
        const testCase = await testCaseDao.updateTestCase(requestedTestCase);
        if (testCase === null) {
            return res.status(StatusCodes.NOT_FOUND).json({
                error: "Cannot find any test case with the provided testCaseId",
            });
        }
        return res.status(StatusCodes.OK).json(testCase);
    })
);

problemRouter.delete(
    "/:problemId",
    asyncHandler(async (req, res) => {
        const problemId = req.params.problemId;
        const deletedCount = await problemDao.deleteProblem(problemId);
        if (deletedCount === 0) {
            return res.status(StatusCodes.NOT_FOUND).json({
                error: "Cannot find any problem with the provided problemId",
            });
        }
        return res.status(StatusCodes.OK).send();
    })
);

problemRouter.delete(
    "/testCases/:testCaseId",
    asyncHandler(async (req, res) => {
        const testCaseId = req.params.testCaseId;
        const deletedCount = await testCaseDao.deleteTestCase(testCaseId);
        if (deletedCount === 0) {
            return res.status(StatusCodes.NOT_FOUND).json({
                error: "Cannot find any test case with the provided testCaseId",
            });
        }
        return res.status(StatusCodes.OK).send();
    })
);

// Error handler
problemRouter.use(async (err, req, res, next) => {
    if (err instanceof NoSuchUserError) {
        return res.status(StatusCodes.BAD_REQUEST).json({
            error: "Cannot find any user with the provided username",
        });
    }
    if (err instanceof NoSuchProblemError) {
        return res.status(StatusCodes.NOT_FOUND).json({
            error: "Cannot find any problem with the provided problemId",
        });
    }
    if (err instanceof NoSuchTestCaseError) {
        return res.status(StatusCodes.NOT_FOUND).json({
            error: "Cannot find any test case with the provided testCaseId",
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
