import { User } from "./user";
import { Problem } from "./problem";

/**
 * A collection of problems made by an `User` on the TMOJ platform.
 */
export class Collection {
    constructor(
        /**
         * The id of the collection.
         */
        public readonly collectionId: string,
        /**
         * The user who made the collection.
         */
        public readonly owner: User,
        /**
         * The full name of the collection to be displayed on the UI.
         *
         * Can be any non-empty string upto 128 character long, with no leading
         * or trailing whitespace.
         */
        public readonly displayName: string,
        /**
         * The description text of the contest.
         *
         * Can be a HTML document of any length.
         */
        public readonly description: string,
        /**
         * The list of problems in the contest, sorted by the owner.
         */
        public readonly problems: Problem[]
    ) {}
}
