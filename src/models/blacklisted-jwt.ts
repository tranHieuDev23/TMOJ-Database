/**
 * A blacklisted JWT.
 *
 * This class is used internally to store information about blacklisted JWT for
 * features such as logging out and changing passwords.
 */
export class BlacklistedJwt {
    constructor(
        /**
         * The id of the JWT. Corresponding to the `jti` field of the payload.
         */
        public jwtId: string,
        /**
         * Expiration date of the token.
         */
        public exp: Date
    ) {}

    /**
     * Parsing a random Javascript Object, and return a new `BlacklistedJwt`
     * object.
     *
     * This method makes it convenient to convert random objects (from HTTP
     * responses or Mongoose responses) to an object of the proper class.
     *
     * @param obj The object to be parsed.
     * @returns A new `BlacklistedJwt` object, or null if obj is `null` or
     * `undefined`.
     */
    static fromObject(obj: any): BlacklistedJwt {
        if (!obj) {
            return null;
        }
        return new BlacklistedJwt(obj.jwtId, new Date(obj.exp));
    }
}
