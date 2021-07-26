import { User } from "./user";
import { Problem } from "./problem";
import { Announcement } from "./announcement";

/**
 * A contest on the TMOJ platform.
 */
export class Contest {
    constructor(
        /**
         * The id of the contest.
         */
        public readonly contestId: string,
        /**
         * The user who create and organizes the contest.
         */
        public readonly organizer: User,
        /**
         * The full name of the contest to be displayed on the UI.
         *
         * Can be any non-empty string upto 128 character long, with no leading
         * or trailing whitespace.
         */
        public readonly displayName: string,
        /**
         * The starting time of the contest.
         */
        public readonly startTime: Date,
        /**
         * The duration of the contest, in milliseconds.
         */
        public readonly duration: number,
        /**
         * The description text of the contest.
         *
         * Can be a HTML document of any length.
         */
        public readonly description: string,
        /**
         * The list of problems in the contest, sorted by the organizer.
         */
        public readonly problems: Problem[],
        /**
         * The list of users participating in the competition, sorted
         * alphabetically by username.
         */
        public readonly participants: User[],
        /**
         * The list of announcements made related to the competition, sorted by
         * the time they were created.
         */
        public readonly announcements: Announcement[]
    ) {}
}
