/**
 * Announcement made during a Contest.
 *
 * These announcement may be Q&As, problem statement/time extension notices, or
 * solution update.
 */
export class Announcement {
    constructor(
        /**
         * The id of the announcement.
         */
        public readonly announcementId: string,
        /**
         * The timestamp of the announcement.
         */
        public readonly timestamp: Date,
        /**
         * A short string summarizing the content of the announcement.
         *
         * Can be an HTML string of any length.
         */
        public readonly subject: string,
        /**
         * The content of the announcement.
         *
         * Can be an HTML string of any length.
         */
        public readonly content: string
    ) {}
}
