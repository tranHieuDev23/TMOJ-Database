import {
    Contest,
    ContestFilterOptions,
    ContestFormat,
    ContestBase,
} from "../contest";
import mongoose from "./database";
import {
    ContestNotFoundError,
    ProblemNotFoundError,
    UserNotFoundError,
} from "./exceptions";
import { ContestModel, ProblemModel, UserModel } from "./models";

/**
 * Options when running `ContestDao.getContest()`.
 */
export class GetContestOptions {
    public includeProblems: boolean = false;
    public includeParticipants: boolean = false;
    public includeAnnouncements: boolean = false;
}

function filterQuery(options: ContestFilterOptions) {
    const conditions = {};
    if (options.organizer) {
        conditions["organizerUsername"] = {
            $in: options.organizer,
        };
    }
    if (options.format) {
        conditions["format"] = {
            $in: options.format,
        };
    }
    if (options.startTime) {
        const startTimeCondition = {};
        if (options.startTime[0] !== null) {
            startTimeCondition["$gte"] = options.startTime[0];
        }
        if (options.startTime[1] !== null) {
            startTimeCondition["$lte"] = options.startTime[1];
        }
        conditions["startTime"] = startTimeCondition;
    }
    if (options.duration) {
        const durationCondition = {};
        if (options.duration[0] !== null) {
            durationCondition["$gte"] = options.duration[0];
        }
        if (options.duration[1] !== null) {
            durationCondition["$lte"] = options.duration[1];
        }
        conditions["duration"] = durationCondition;
    }
    if (options.isPublic !== undefined && options.isPublic !== null) {
        conditions["isPublic"] = options.isPublic;
    }
    let query = ContestModel.find(conditions);
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

async function documentToContest(
    document: any,
    getOptions: GetContestOptions
): Promise<Contest> {
    document = document.populate("organizer");
    if (getOptions.includeProblems) {
        document = document.populate({
            path: "problems",
            populate: {
                path: "author",
            },
        });
    }
    if (getOptions.includeParticipants) {
        document = document.populate("participants");
    }
    if (getOptions.includeAnnouncements) {
        document = document.populate({
            path: "announcements",
            options: { sort: { timestamp: -1 } },
        });
    }
    const contest = Contest.fromObject(await document.execPopulate());
    if (!getOptions.includeProblems) {
        delete contest.problems;
    }
    if (!getOptions.includeParticipants) {
        delete contest.participants;
    }
    if (!getOptions.includeAnnouncements) {
        delete contest.announcements;
    }
    return contest;
}

export class ContestDao {
    private constructor() {}

    private static readonly INSTANCE = new ContestDao();

    public static getInstance(): ContestDao {
        return ContestDao.INSTANCE;
    }

    public async getContest(
        contestId: string,
        getOptions: GetContestOptions = new GetContestOptions()
    ): Promise<Contest> {
        const document = await ContestModel.findOne({ contestId }).exec();
        if (document === null) {
            return null;
        }
        return await documentToContest(document, getOptions);
    }

    public async getContestList(
        filterOptions: ContestFilterOptions,
        asUser: string = undefined,
        getOptions: GetContestOptions = new GetContestOptions()
    ): Promise<Contest[]> {
        let query = filterQuery(filterOptions);
        if (asUser !== undefined) {
            query = query.find({
                $or: [{ organizerUsername: asUser }, { isPublic: true }],
            });
        }
        const documents = await query.exec();
        const results = await Promise.all(
            documents.map((item) => documentToContest(item, getOptions))
        );
        return results;
    }

    public async getContestListCount(
        filterOptions: ContestFilterOptions,
        asUser: string = undefined
    ): Promise<number> {
        let query = filterQuery(filterOptions);
        if (asUser !== undefined) {
            query = query.find({
                $or: [{ organizerUsername: asUser }, { isPublic: true }],
            });
        }
        return await query.estimatedDocumentCount().exec();
    }

    public async addContest(contest: ContestBase): Promise<Contest> {
        return new Promise<Contest>(async (resolve, reject) => {
            try {
                const session = await mongoose.startSession();
                await session.withTransaction(async () => {
                    const username = contest.organizerUsername;
                    const userDocument = await UserModel.findOne({
                        username,
                    }).exec();
                    if (userDocument === null) {
                        throw new UserNotFoundError(username);
                    }
                    const contestDocument = await ContestModel.create({
                        contestId: contest.contestId,
                        organizer: userDocument._id,
                        organizerUsername: username,
                        displayName: contest.displayName,
                        format: contest.format.valueOf(),
                        startTime: contest.startTime,
                        duration: contest.duration,
                        description: contest.description,
                        isPublic: contest.isPublic,
                    });
                    resolve(
                        await documentToContest(
                            contestDocument,
                            new GetContestOptions()
                        )
                    );
                });
                session.endSession();
            } catch (e) {
                reject(e);
            }
        });
    }

    public async updateContest(contest: ContestBase): Promise<Contest> {
        const { contestId } = contest;
        // Update everything except for the id and the organizer
        delete contest.contestId;
        delete contest.organizerUsername;
        const updatedDocument = await ContestModel.findOneAndUpdate(
            { contestId },
            contest
        ).exec();
        if (updatedDocument === null) {
            return null;
        }
        return await documentToContest(
            updatedDocument,
            new GetContestOptions()
        );
    }

    public async addContestProblem(
        contestId: string,
        problemId: string
    ): Promise<void> {
        const session = await mongoose.startSession();
        await session.withTransaction(async () => {
            const contestDocument = await ContestModel.findOne({
                contestId,
            }).exec();
            if (contestDocument === null) {
                throw new ContestNotFoundError(contestId);
            }
            const problemDocument = await ProblemModel.findOne({
                problemId,
            }).exec();
            if (problemDocument === null) {
                throw new ProblemNotFoundError(problemId);
            }
            await contestDocument.update({
                $addToSet: { problems: problemDocument._id },
            });
        });
        session.endSession();
    }

    public async removeContestProblem(
        contestId: string,
        problemId: string
    ): Promise<void> {
        const session = await mongoose.startSession();
        await session.withTransaction(async () => {
            const contestDocument = await ContestModel.findOne({
                contestId,
            }).exec();
            if (contestDocument === null) {
                throw new ContestNotFoundError(contestId);
            }
            const problemDocument = await ProblemModel.findOne({
                problemId,
            }).exec();
            if (problemDocument === null) {
                throw new ProblemNotFoundError(problemId);
            }
            await contestDocument.update({
                $pull: { problems: problemDocument._id },
            });
        });
        session.endSession();
    }

    public async addContestParticipant(
        contestId: string,
        username: string
    ): Promise<void> {
        const session = await mongoose.startSession();
        await session.withTransaction(async () => {
            const contestDocument = await ContestModel.findOne({
                contestId,
            }).exec();
            if (contestDocument === null) {
                throw new ContestNotFoundError(contestId);
            }
            const problemDocument = await UserModel.findOne({
                username,
            }).exec();
            if (problemDocument === null) {
                throw new UserNotFoundError(username);
            }
            await contestDocument.update({
                $addToSet: { participants: problemDocument._id },
            });
        });
        session.endSession();
    }

    public async removeContestParticipant(
        contestId: string,
        username: string
    ): Promise<void> {
        const session = await mongoose.startSession();
        await session.withTransaction(async () => {
            const contestDocument = await ContestModel.findOne({
                contestId,
            }).exec();
            if (contestDocument === null) {
                throw new ContestNotFoundError(contestId);
            }
            const userDocument = await UserModel.findOne({
                username,
            }).exec();
            if (userDocument === null) {
                throw new UserNotFoundError(username);
            }
            await contestDocument.update({
                $pull: { participants: userDocument._id },
            });
        });
        session.endSession();
    }

    public async deleteContest(contestId: string): Promise<number> {
        const deletedDocument = await ContestModel.deleteOne({ contestId });
        return deletedDocument.deletedCount;
    }
}
