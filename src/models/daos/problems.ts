import { Problem, ProblemChecker, ProblemFilterOptions } from "../problem";
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
        public creationDate: string,
        public isPublic: boolean,
        public timeLimit: number,
        public memoryLimit: number,
        public inputSource: string,
        public outputSource: string,
        public checker: ProblemChecker | string
    ) {}
}

function filterQuery(options: ProblemFilterOptions) {
    const conditions = {};
    if (options.author) {
        conditions["authorUsername"] = {
            $in: options.author,
        };
    }
    if (options.creationDate) {
        const creationDateCondition = {};
        if (options.creationDate[0] !== null) {
            creationDateCondition["$gte"] = options.creationDate[0];
        }
        if (options.creationDate[1] !== null) {
            creationDateCondition["$lte"] = options.creationDate[1];
        }
        conditions["creationDate"] = creationDateCondition;
    }
    if (options.isPublic !== undefined && options.isPublic !== null) {
        conditions["isPublic"] = options.isPublic;
    }
    let query = ProblemModel.find(conditions);
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

async function documentToProblem(
    document: any,
    includeTestcases: boolean = false
): Promise<Problem> {
    document = document.populate("author");
    if (includeTestcases) {
        document = document.populate("testCases");
    }
    const problem = Problem.fromObject(await document.execPopulate());
    if (!includeTestcases) {
        delete problem.testCases;
    }
    return problem;
}

export class ProblemDao {
    private constructor() {}

    private static readonly INSTANCE = new ProblemDao();

    public static getInstance(): ProblemDao {
        return ProblemDao.INSTANCE;
    }

    public async getProblem(
        problemId: string,
        includeTestCases: boolean = false
    ): Promise<Problem> {
        const query = ProblemModel.findOne({ problemId });
        const document = await query.exec();
        if (document === null) {
            return null;
        }
        return await documentToProblem(document, includeTestCases);
    }

    public async getProblemList(
        filterOptions: ProblemFilterOptions,
        includeTestCases: boolean = false
    ): Promise<Problem[]> {
        const documents = await filterQuery(filterOptions).exec();
        const results = await Promise.all(
            documents.map((item) => documentToProblem(item, includeTestCases))
        );
        return results;
    }

    public async addProblem(problem: ProblemMetadata): Promise<Problem> {
        return new Promise<Problem>(async (resolve, reject) => {
            try {
                const session = await mongoose.startSession();
                await session.withTransaction(async () => {
                    const username = problem.authorUsername;
                    const userDocument = await UserModel.findOne({
                        username,
                    }).exec();
                    if (userDocument === null) {
                        throw new UserNotFoundError(username);
                    }
                    const problemDocument = await ProblemModel.create({
                        problemId: problem.problemId,
                        author: userDocument._id,
                        authorUsername: username,
                        displayName: problem.displayName,
                        creationDate: problem.creationDate,
                        isPublic: problem.isPublic,
                        timeLimit: problem.timeLimit,
                        memoryLimit: problem.memoryLimit,
                        inputSource: problem.inputSource,
                        outputSource: problem.outputSource,
                        checker: problem.checker,
                    });
                    resolve(await documentToProblem(problemDocument));
                });
                session.endSession();
            } catch (e) {
                reject(e);
            }
        });
    }

    public async updateProblem(problem: ProblemMetadata): Promise<Problem> {
        const { problemId } = problem;
        // Update everything except for the id, the author and the creation date
        delete problem.problemId;
        delete problem.authorUsername;
        delete problem.creationDate;
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
