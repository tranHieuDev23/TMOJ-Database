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
        public announcementId: string,
        /**
         * The timestamp of the announcement.
         */
        public timestamp: Date,
        /**
         * A short string summarizing the content of the announcement.
         *
         * Can be an HTML string of any length.
         */
        public subject: string,
        /**
         * The content of the announcement.
         *
         * Can be an HTML string of any length.
         */
        public content: string
    ) {}

    /**
     * Parsing a random Javascript Object, and return a new `Announcement`
     * object.
     *
     * This method makes it convenient to convert random objects (from HTTP
     * responses or Mongoose responses) to an object of the proper class.
     *
     * @param obj The object to be parsed.
     * @returns A new `Announcement` object, or null if obj is `null` or `undefined`.
     */
    public static fromObject(obj: any): Announcement {
        if (!obj) {
            return null;
        }
        return new Announcement(
            obj.announcementId,
            obj.timestamp,
            obj.subject,
            obj.content
        );
    }
}
