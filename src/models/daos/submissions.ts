import {
    Submission,
    SubmissionFilterOptions,
    SubmissionBase,
} from "../submission";
import mongoose from "./database";
import {
    ContestNotFoundError,
    ProblemNotFoundError,
    TestCaseNotFoundError,
    UserNotFoundError,
} from "./exceptions";
import {
    ContestModel,
    ProblemModel,
    SubmissionModel,
    TestCaseModel,
    UserModel,
} from "./models";

function filterQuery(options: SubmissionFilterOptions) {
    const conditions = {};
    if (options.author) {
        conditions["authorUsername"] = {
            $in: options.author,
        };
    }
    if (options.problem) {
        conditions["problemId"] = {
            $in: options.problem,
        };
    }
    if (options.contest) {
        conditions["contestId"] = {
            $in: options.contest,
        };
    }
    if (options.language) {
        conditions["language"] = {
            $in: options.language,
        };
    }
    if (options.status) {
        conditions["status"] = {
            $in: options.status,
        };
    }
    if (options.submissionTime) {
        const submissionTimeCondition = {};
        if (options.submissionTime[0] !== null) {
            submissionTimeCondition["$gte"] = options.submissionTime[0];
        }
        if (options.submissionTime[1] !== null) {
            submissionTimeCondition["$lte"] = options.submissionTime[1];
        }
        conditions["creationDate"] = submissionTimeCondition;
    }
    let query = SubmissionModel.find(conditions);
    if (options.sortFields) {
        const sortCondition = {};
        for (const item of options.sortFields) {
            sortCondition[item.field] = item.ascending ? 1 : -1;
        }
        query = query.sort(sortCondition);
    }
    if (options.startIndex !== 0) {
        query = query.skip(options.startIndex);
    }
    if (options.itemCount !== null) {
        query = query.limit(options.itemCount);
    }
    return query;
}

async function documentToSubmission(document: any): Promise<Submission> {
    document = await document
        .populate("author")
        .populate({
            path: "problem",
            populate: {
                path: "author",
            },
        })
        .populate({
            path: "contest",
            populate: {
                path: "organizer",
            },
        })
        .execPopulate();
    const submission = Submission.fromObject(document);
    // There's no need to send test cases information along
    // with submissions
    delete submission.problem.testCases;
    // There's also no need to send information about contest's
    // problems, participants and announcements
    if (submission.contest) {
        delete submission.contest.problems;
        delete submission.contest.participants;
        delete submission.contest.announcements;
    }
    return submission;
}

export class SubmissionDao {
    private constructor() {}

    private static readonly INSTANCE = new SubmissionDao();

    public static getInstance(): SubmissionDao {
        return SubmissionDao.INSTANCE;
    }

    public async getSubmission(submissionId: string): Promise<Submission> {
        const document = await SubmissionModel.findOne({ submissionId }).exec();
        if (document === null) {
            return null;
        }
        return await documentToSubmission(document);
    }

    public async getSubmissionList(
        filterOptions: SubmissionFilterOptions,
        asUser: string = undefined
    ): Promise<Submission[]> {
        let query = filterQuery(filterOptions);
        if (asUser !== undefined) {
            query = query.find({
                problem: {
                    $subquery: {
                        $or: [
                            {
                                authorUsername: asUser,
                            },
                            {
                                isPublic: true,
                            },
                        ],
                    },
                },
            });
        }
        const documents = await query.exec();
        const results = await Promise.all(
            documents.map((item) => documentToSubmission(item))
        );
        return results;
    }

    public async addSubmission(
        submission: SubmissionBase
    ): Promise<Submission> {
        return new Promise<Submission>(async (resolve, reject) => {
            try {
                const session = await mongoose.startSession();
                await session.withTransaction(async () => {
                    const { authorUsername, problemId, contestId, result } =
                        submission;
                    const failedTestCaseId = result?.failedTestCaseId;
                    const userDocument = await UserModel.findOne({
                        username: authorUsername,
                    }).exec();
                    if (userDocument === null) {
                        throw new UserNotFoundError(authorUsername);
                    }
                    const problemDocument = await ProblemModel.findOne({
                        problemId,
                    }).exec();
                    if (problemDocument === null) {
                        throw new ProblemNotFoundError(problemId);
                    }
                    const testCaseDocument = failedTestCaseId
                        ? await TestCaseModel.findOne({
                              testCaseId: failedTestCaseId,
                          }).exec()
                        : null;
                    if (failedTestCaseId && testCaseDocument === null) {
                        throw new TestCaseNotFoundError(failedTestCaseId);
                    }
                    const contestDocument = contestId
                        ? await ContestModel.findOne({
                              contestId,
                          }).exec()
                        : null;
                    if (contestId && contestDocument === null) {
                        throw new ContestNotFoundError(contestId);
                    }

                    const submissionDocument = await SubmissionModel.create({
                        submissionId: submission.submissionId,
                        author: userDocument._id,
                        authorUsername: authorUsername,
                        problem: problemDocument._id,
                        problemId: problemId,
                        contest: contestDocument?._id,
                        contestId: contestId,
                        sourceFile: submission.sourceFile,
                        language: submission.language.valueOf(),
                        submissionTime: submission.submissionTime,
                        status: submission.status.valueOf(),
                        result: result,
                    });
                    resolve(await documentToSubmission(submissionDocument));
                });
                session.endSession();
            } catch (e) {
                reject(e);
            }
        });
    }

    public async updateSubmission(
        submission: SubmissionBase
    ): Promise<Submission> {
        return new Promise<Submission>(async (resolve, reject) => {
            try {
                const conditions = { submissionId: submission.submissionId };
                // Update everything except for the author, problem and contest
                delete submission.authorUsername;
                delete submission.problemId;
                delete submission.contestId;
                // If failed test case's id exists, we should check if the test
                // case exists first
                if (submission.result?.failedTestCaseId) {
                    const testCaseId = submission.result.failedTestCaseId;
                    const testCaseDocument = await TestCaseModel.findOne({
                        testCaseId,
                    }).exec();
                    if (testCaseDocument !== null) {
                        throw new TestCaseNotFoundError(testCaseId);
                    }
                    delete submission.result.failedTestCaseId;
                    submission.result["failedTestCase"] = testCaseDocument._id;
                }
                const updatedDocument = await SubmissionModel.findOneAndUpdate(
                    conditions,
                    submission
                ).exec();
                if (updatedDocument === null) {
                    return resolve(null);
                }
                return resolve(await documentToSubmission(updatedDocument));
            } catch (e) {
                reject(e);
            }
        });
    }

    public async deleteSubmission(submissionId: string): Promise<number> {
        const deletedDocument = await SubmissionModel.deleteOne({
            submissionId,
        });
        return deletedDocument.deletedCount;
    }
}
