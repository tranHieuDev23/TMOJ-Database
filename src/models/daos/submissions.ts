import {
    Submission,
    SubmissionLanguage,
    SubmissionStatus,
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

export class SubmissionMetadata {
    constructor(
        public submissionId: string,
        public authorUsername: string,
        public problemId: string,
        public contestId: string,
        public sourceFile: string,
        public language: SubmissionLanguage,
        public submissionTime: Date,
        public status: SubmissionStatus,
        public score: number,
        public runTime: number,
        public failedTestCaseId: string,
        public log: string
    ) {}
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
        .populate("failedTestCase")
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

    public async addSubmission(
        submission: SubmissionMetadata
    ): Promise<Submission> {
        return new Promise<Submission>(async (resolve, reject) => {
            try {
                const session = await mongoose.startSession();
                await session.withTransaction(async () => {
                    const {
                        authorUsername,
                        problemId,
                        contestId,
                        failedTestCaseId,
                    } = submission;
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
                        problem: problemDocument._id,
                        contest: contestDocument?._id,
                        sourceFile: submission.sourceFile,
                        language: submission.language.valueOf(),
                        submissionTime: submission.submissionTime,
                        status: submission.status.valueOf(),
                        score: submission.score,
                        runTime: submission.runTime,
                        failedTestCase: testCaseDocument?._id,
                        log: submission.log,
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
        submission: SubmissionMetadata
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
                if (submission.failedTestCaseId) {
                    const testCaseId = submission.failedTestCaseId;
                    const testCaseDocument = await TestCaseModel.findOne({
                        testCaseId,
                    }).exec();
                    if (testCaseDocument !== null) {
                        throw new TestCaseNotFoundError(testCaseId);
                    }
                    delete submission.failedTestCaseId;
                    submission["failedTestCase"] = testCaseDocument._id;
                }
                const updatedDocument = await SubmissionModel.findOneAndUpdate(
                    conditions,
                    submission
                ).exec();
                if (updatedDocument === null) {
                    return null;
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
