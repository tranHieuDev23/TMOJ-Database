/**
 * An User on the TMOJ platform.
 *
 * In the future, we want to limit the user's permission on the platform. For
 * example, administrator users should have full permission, while participants
 * users should only be able to see problems and submit solutions.
 */
export class User {
    constructor(
        /**
         * The username of the User.
         *
         * Used to identify and log the user in. This field should be at 6-32
         * character long, consisting of lowercase and uppercase English
         * characters, digits and underscore (_).
         */
        public username: string,
        /**
         * The full, proper name to be displayed on the UI.
         *
         * Can be any non-empty string upto 64 character long, with no leading
         * or trailing whitespace.
         */
        public displayName: string
    ) {}

    /**
     * Parsing a random Javascript Object, and return a new `User` object.
     *
     * This method makes it convenient to convert random objects (from HTTP
     * responses or Mongoose responses) to an object of the proper class.
     *
     * @param obj The object to be parsed.
     * @returns A new `User` object, or null if obj is `null` or `undefined`.
     */
    public static fromObject(obj: any): User {
        if (!obj) {
            return null;
        }
        return new User(obj.username, obj.displayName);
    }
}
