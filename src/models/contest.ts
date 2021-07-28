import { User } from "./user";
import { Problem } from "./problem";
import { Announcement } from "./announcement";

/**
 * The format of a contest.
 */
export enum ContestFormat {
    /**
     * The format used for IOI contests.
     *
     * Partial score is allowed - the more tests a participant's submission
     * passes, the higher score they receive.
     */
    IOI = "IOI",
    /**
     * The format used for ACM-ICPC contests.
     *
     * A submission receives the full score of 1 only when it passed all test
     * cases.
     */
    ICPC = "ICPC",
}

export function getAllContestFormats(): ContestFormat[] {
    return [ContestFormat.IOI, ContestFormat.ICPC];
}

/**
 * A contest on the TMOJ platform.
 */
export class Contest {
    constructor(
        /**
         * The id of the contest.
         */
        public contestId: string,
        /**
         * The user who create and organizes the contest.
         */
        public organizer: User,
        /**
         * The full name of the contest to be displayed on the UI.
         *
         * Can be any non-empty string upto 128 character long, with no leading
         * or trailing whitespace.
         */
        public displayName: string,
        /**
         * The format of the contest.
         */
        public format: ContestFormat,
        /**
         * The starting time of the contest.
         */
        public startTime: Date,
        /**
         * The duration of the contest, in milliseconds.
         */
        public duration: number,
        /**
         * The description text of the contest.
         *
         * Can be a HTML document of any length.
         */
        public description: string,
        /**
         * Whether this contest should be public for every user to view or
         * not.
         */
        public isPublic: boolean,
        /**
         * The list of problems in the contest, sorted by the organizer.
         */
        public problems: Problem[],
        /**
         * The list of users participating in the competition, sorted
         * alphabetically by username.
         */
        public participants: User[],
        /**
         * The list of announcements made related to the competition, sorted by
         * the time they were created.
         */
        public announcements: Announcement[]
    ) {}

    /**
     * Parsing a random Javascript Object, and return a new `Contest`
     * object.
     *
     * This method makes it convenient to convert random objects (from HTTP
     * responses or Mongoose responses) to an object of the proper class.
     *
     * @param obj The object to be parsed.
     * @returns A new `Contest` object, or null if obj is `null` or
     * `undefined`.
     */
    public static fromObject(obj: any): Contest {
        if (!obj) {
            return null;
        }
        const problems = obj.problems
            ? (obj.problems as any[])
                  .filter((item) => item !== null)
                  .map((item) => Problem.fromObject(item))
            : [];
        const participants = obj.participants
            ? (obj.participants as any[])
                  .filter((item) => item !== null)
                  .map((item) => User.fromObject(item))
            : [];
        const announcements = obj.announcements
            ? (obj.announcements as any[])
                  .filter((item) => item !== null)
                  .map((item) => Announcement.fromObject(item))
            : [];
        return new Contest(
            obj.contestId,
            User.fromObject(obj.organizer),
            obj.displayName,
            ContestFormat[obj.format],
            obj.startTime,
            obj.duration,
            obj.description,
            obj.isPublic,
            problems,
            participants,
            announcements
        );
    }
}

/**
 * Options to filter for contests in a list.
 */
export class ContestFilterOptions {
    /**
     * Index of the first element in the result list, relative to the total
     * result list.
     *
     * Default to 0.
     */
    public startIndex: number = 0;
    /**
     * The number of elements to return.
     *
     * Default to `null` (return as many elements as possible).
     */
    public itemCount: number = null;
    /**
     * A list of usernames of organizers to include.
     *
     * Default to `null` (no filter).
     */
    public organizer: string[] = null;
    /**
     * A list of contest formats to include.
     *
     * Default to `null` (no filter).
     */
    public format: ContestFormat[] = null;
    /**
     * If equal to `null`, apply no filter to start time.
     *
     * If equal to an array of two `Date` objects, the start time of the
     * contest must lie between the two `Date` objects' value.
     *
     * If one of the two objects is equal to `null`, that end is not bounded.
     *
     * Default to `null` (no filter).
     */
    public startTime: Date[] = null;
    /**
     * If equal to `null`, apply no filter to contest's duration.
     *
     * If equal to an array of two `number` values, the duration of the
     * contest must lie between the two `number` values' value.
     *
     * If one of the two values is equal to `null`, that end is not bounded.
     *
     * Default to `null` (no filter).
     */
    public duration: number[] = null;
    /**
     * If not `null`, filter for contests with the specified `isPublic`
     * value.
     *
     * Default to `null` (no filter).
     */
    public isPublic: boolean[] = null;
    /**
     * Sort orders within the search result.
     *
     * Default to `[{field: "startTime", ascending: false}]` (latest contest
     * first).
     */
    public sortFields: { field: string; ascending: boolean }[] = [
        {
            field: "startTime",
            ascending: false,
        },
    ];
}
