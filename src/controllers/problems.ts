import { Router } from "express";
import asyncHandler from "express-async-handler";
import { StatusCodes } from "http-status-codes";
import { ProblemDao } from "../models/daos/problems";
import { TestCaseDao } from "../models/daos/testcases";
import { TestCase } from "../models/testcase";
import {
    ProblemNotFoundError,
    TestCaseNotFoundError,
} from "../models/daos/exceptions";
import { ProblemFilterOptions, ProblemBase } from "../models/problem";

const problemDao = ProblemDao.getInstance();
const testCaseDao = TestCaseDao.getInstance();

export const problemRouter = Router();

problemRouter.post(
    "/",
    asyncHandler(async (req, res) => {
        const requestedProblem = req.body as ProblemBase;
        const newProblem = await problemDao.addProblem(requestedProblem);
        const newLocation = `${req.originalUrl}${newProblem.problemId}`;
        res.setHeader("Location", newLocation);
        return res.status(StatusCodes.CREATED).json(newProblem);
    })
);

problemRouter.post(
    "/:problemId/testCases",
    asyncHandler(async (req, res) => {
        const problemId = req.params.problemId;
        const requestedTestCase = TestCase.fromObject(req.body);
        const newTestCase = await testCaseDao.addTestCase(requestedTestCase);
        await problemDao.addProblemTestCase(problemId, newTestCase.testCaseId);
        const newLocation = `${req.baseUrl}/testCases/${newTestCase.testCaseId}`;
        res.setHeader("Location", newLocation);
        return res.status(StatusCodes.OK).json(newTestCase);
    })
);

problemRouter.get(
    "/",
    asyncHandler(async (req, res) => {
        const filterOptions = req.body.filterOptions as ProblemFilterOptions;
        const asUser = req.body.asUser as string;
        const problems = await problemDao.getProblemList(filterOptions, asUser);
        filterOptions.startIndex = 0;
        filterOptions.itemCount = null;
        const totalItemCount = await problemDao.getProblemListCount(
            filterOptions,
            asUser
        );
        return res.status(StatusCodes.OK).json({
            totalItemCount,
            problems,
        });
    })
);

problemRouter.get(
    "/:problemId",
    asyncHandler(async (req, res) => {
        const problemId = req.params.problemId;
        const problem = await problemDao.getProblem(problemId);
        if (problem === null) {
            throw new ProblemNotFoundError(problemId);
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
            throw new ProblemNotFoundError(problemId);
        }
        return res.status(StatusCodes.OK).json(problem.testCases);
    })
);

problemRouter.patch(
    "/:problemId",
    asyncHandler(async (req, res) => {
        const problemId = req.params.problemId;
        const requestedProblem = req.body as ProblemBase;
        requestedProblem.problemId = problemId;
        const problem = await problemDao.updateProblem(requestedProblem);
        if (problem === null) {
            throw new ProblemNotFoundError(problemId);
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
            throw new TestCaseNotFoundError(testCaseId);
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
            throw new ProblemNotFoundError(problemId);
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
            throw new TestCaseNotFoundError(testCaseId);
        }
        return res.status(StatusCodes.OK).send();
    })
);
