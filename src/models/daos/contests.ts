import { Contest, ContestFilterOptions, ContestFormat } from "../contest";
import mongoose from "./database";
import { ContestModel, ProblemModel, UserModel } from "./models";

/**
 * Basic information needed to add or update a Contest in the database.
 */
export class ContestMetadata {
    constructor(
        public contestId: string,
        public organizerUsername: string,
        public displayName: string,
        public format: ContestFormat,
        public startTime: Date,
        public duration: number,
        public description: string
    ) {}
}

/**
 * Options when running `ContestDao.getContest()`.
 */
export class GetContestOptions {
    public includeProblems: boolean = false;
    public includeParticipants: boolean = false;
    public includeAnnouncement: boolean = false;
}

export class NoSuchUserError extends Error {
    constructor(public readonly username: string) {
        super(`No user with the provided username was found: ${username}`);
    }
}

export class NoSuchContestError extends Error {
    constructor(public readonly contestId: string) {
        super(`No contest with the provided contestId was found: ${contestId}`);
    }
}

export class NoSuchProblemError extends Error {
    constructor(public readonly contestId: string) {
        super(`No problem with the provided contestId was found: ${contestId}`);
    }
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
        let query = ContestModel.findOne({ contestId }).populate("organizer");
        if (getOptions.includeProblems) {
            query = query.populate("problems");
        }
        if (getOptions.includeParticipants) {
            query = query.populate("participants");
        }
        if (getOptions.includeAnnouncement) {
            query = query.populate("announcements");
        }
        const document = await query.exec();
        if (document === null) {
            return null;
        }
        const result = Contest.fromObject(document);
        if (!getOptions.includeProblems) {
            delete result.problems;
        }
        if (!getOptions.includeParticipants) {
            delete result.participants;
        }
        if (!getOptions.includeAnnouncement) {
            delete result.announcements;
        }
        return result;
    }

    public async getContestList(
        filterOptions: ContestFilterOptions = new ContestFilterOptions(),
        getOptions: GetContestOptions = new GetContestOptions()
    ): Promise<Contest[]> {
        let query = filterQuery(filterOptions).populate("organizer");;
        if (getOptions.includeProblems) {
            query = query.populate("problems");
        }
        if (getOptions.includeParticipants) {
            query = query.populate("participants");
        }
        if (getOptions.includeAnnouncement) {
            query = query.populate("announcements");
        }
        const documents = await query.exec();
        const results = documents.map((item) => {
            const result = Contest.fromObject(item);
            if (!getOptions.includeProblems) {
                delete result.problems;
            }
            if (!getOptions.includeParticipants) {
                delete result.participants;
            }
            if (!getOptions.includeAnnouncement) {
                delete result.announcements;
            }
            return result;
        });
        return results;
    }

    public async addContest(contest: ContestMetadata): Promise<void> {
        const session = await mongoose.startSession();
        await session.withTransaction(async () => {
            const username = contest.organizerUsername;
            const userDocument = await UserModel.findOne({ username }).exec();
            if (userDocument === null) {
                throw new NoSuchUserError(username);
            }
            await ContestModel.create({
                contestId: contest.contestId,
                organizer: userDocument._id,
                organizerUsername: username,
                displayName: contest.displayName,
                format: contest.format.valueOf(),
                startTime: contest.startTime,
                duration: contest.duration,
                description: contest.description,
            });
        });
        session.endSession();
    }

    public async updateContest(contest: ContestMetadata): Promise<Contest> {
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
        const updatedContest = Contest.fromObject(updatedDocument);
        delete updatedContest.problems;
        delete updatedContest.participants;
        delete updatedContest.announcements;
        return updatedContest;
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
                throw new NoSuchContestError(contestId);
            }
            const problemDocument = await ProblemModel.findOne({
                problemId,
            }).exec();
            if (problemDocument === null) {
                throw new NoSuchProblemError(problemId);
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
                throw new NoSuchContestError(contestId);
            }
            const problemDocument = await ProblemModel.findOne({
                problemId,
            }).exec();
            if (problemDocument === null) {
                throw new NoSuchProblemError(problemId);
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
                throw new NoSuchContestError(contestId);
            }
            const problemDocument = await UserModel.findOne({
                username,
            }).exec();
            if (problemDocument === null) {
                throw new NoSuchUserError(username);
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
                throw new NoSuchContestError(contestId);
            }
            const problemDocument = await ProblemModel.findOne({
                problemId: username,
            }).exec();
            if (problemDocument === null) {
                throw new NoSuchUserError(username);
            }
            await contestDocument.update({
                $pull: { participants: problemDocument._id },
            });
        });
        session.endSession();
    }

    public async deleteContest(contestId: string): Promise<number> {
        const deletedDocument = await ContestModel.deleteOne({ contestId });
        return deletedDocument.deletedCount;
    }
}
