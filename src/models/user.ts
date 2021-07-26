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
        public readonly username: string,
        /**
         * The full, proper name to be displayed on the UI.
         *
         * Can be any non-empty string upto 64 character long, with no leading
         * or trailing whitespace.
         */
        public readonly displayName: string
    ) {}
}
