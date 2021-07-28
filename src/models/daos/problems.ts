import { Problem, ProblemChecker } from "../problem";
import mongoose from "./database";
import {
    ProblemNotFoundError,
    TestCaseNotFoundError,
    UserNotFoundError,
} from "./exceptions";
import { ProblemModel, TestCaseModel, UserModel } from "./models";

/**
 * Basic information needed to add or update a Problem in the database.
 */
export class ProblemMetadata {
    constructor(
        public problemId: string,
        public authorUsername: string,
        public displayName: string,
        public timeLimit: number,
        public memoryLimit: number,
        public inputSource: string,
        public outputSource: string,
        public checker: ProblemChecker | string
    ) {}
}

export class ProblemDao {
    private constructor() {}

    private static readonly INSTANCE = new ProblemDao();

    public static getInstance(): ProblemDao {
        return ProblemDao.INSTANCE;
    }

    public async getProblem(
        problemId: string,
        includeTestcases: boolean = false
    ): Promise<Problem> {
        let query = ProblemModel.findOne({ problemId }).populate("author");
        if (includeTestcases) {
            query = query.populate("testCases");
        }
        const document = await query.exec();
        if (document === null) {
            return null;
        }
        const result = Problem.fromObject(document);
        if (!includeTestcases) {
            delete result.testCases;
        }
        return result;
    }

    public async addProblem(problem: ProblemMetadata): Promise<void> {
        const session = await mongoose.startSession();
        await session.withTransaction(async () => {
            const username = problem.authorUsername;
            const userDocument = await UserModel.findOne({ username }).exec();
            if (userDocument === null) {
                throw new UserNotFoundError(username);
            }
            await ProblemModel.create({
                problemId: problem.problemId,
                author: userDocument._id,
                displayName: problem.displayName,
                timeLimit: problem.timeLimit,
                memoryLimit: problem.memoryLimit,
                inputSource: problem.inputSource,
                outputSource: problem.outputSource,
                checker: problem.checker,
            });
        });
        session.endSession();
    }

    public async updateProblem(problem: ProblemMetadata): Promise<Problem> {
        const { problemId } = problem;
        // Update everything except for the id and the author
        delete problem.problemId;
        delete problem.authorUsername;
        const updatedDocument = await ProblemModel.findOneAndUpdate(
            { problemId },
            problem
        ).exec();
        if (updatedDocument === null) {
            return null;
        }
        const updatedProblem = Problem.fromObject(updatedDocument);
        delete updatedProblem.testCases;
        return updatedProblem;
    }

    public async addProblemTestCase(
        problemId: string,
        testCaseId: string
    ): Promise<void> {
        const session = await mongoose.startSession();
        await session.withTransaction(async () => {
            const problemDocument = await ProblemModel.findOne({
                problemId,
            }).exec();
            if (problemDocument === null) {
                throw new ProblemNotFoundError(problemId);
            }
            const testCaseDocument = await TestCaseModel.findOne({
                testCaseId,
            }).exec();
            if (testCaseDocument === null) {
                throw new TestCaseNotFoundError(testCaseId);
            }
            await problemDocument.update({
                $addToSet: { testCases: testCaseDocument._id },
            });
        });
        session.endSession();
    }

    public async removeProblemTestCase(
        problemId: string,
        testCaseId: string
    ): Promise<void> {
        const session = await mongoose.startSession();
        await session.withTransaction(async () => {
            const problemDocument = await ProblemModel.findOne({
                problemId,
            }).exec();
            if (problemDocument === null) {
                throw new ProblemNotFoundError(problemId);
            }
            const testCaseDocument = await TestCaseModel.findOne({
                testCaseId,
            }).exec();
            if (testCaseDocument === null) {
                throw new TestCaseNotFoundError(testCaseId);
            }
            await problemDocument.update({
                $pull: { testCases: testCaseDocument._id },
            });
        });
        session.endSession();
    }

    public async deleteProblem(problemId: string): Promise<number> {
        const deletedDocument = await ProblemModel.deleteOne({ problemId });
        return deletedDocument.deletedCount;
    }
}
