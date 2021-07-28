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
        public failedTestCaseId: string,
        public log: string
    ) {}
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
        return Submission.fromObject(document);
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
                        failedTestCase: testCaseDocument?._id,
                        log: submission.log,
                    });
                    await submissionDocument
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
                    const newSubmission =
                        Submission.fromObject(submissionDocument);
                    // There's no need to send test cases information along
                    // with submissions
                    delete newSubmission.problem.testCases;
                    // There's also no need to send information about contest's
                    // problems, participants and announcements
                    if (newSubmission.contest) {
                        delete newSubmission.contest.problems;
                        delete newSubmission.contest.participants;
                        delete newSubmission.contest.announcements;
                    }
                    resolve(newSubmission);
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
                await updatedDocument
                    .populate("author")
                    .populate("problem")
                    .populate("contest")
                    .populate("failedTestCase")
                    .execPopulate();
                return resolve(Submission.fromObject(updatedDocument));
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
