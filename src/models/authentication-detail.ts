/**
 * Methods to authenticate an user.
 *
 * Currently, we only support password-based authentication. Future version
 * should support OAuth2.
 */
export enum AuthenticationMethod {
    Password = "Password",
}

export function getAllAuthenticationMethods(): AuthenticationMethod[] {
    return [AuthenticationMethod.Password];
}

/**
 * Information necessary for the authentication of an user.
 *
 * By separating this information away from the `User` class, we can improve
 * security by setting more restrictions to the password database, make sure
 * that password hashes will not be mistakenly sent along with user's data, and
 * also make it easier to integrate other methods of authentication into the
 * system.
 *
 * Currently, we only support password-based authentication.
 */
export class AuthenticationDetail {
    constructor(public method: AuthenticationMethod, public value: string) {}

    /**
     * Parsing a random Javascript Object, and return a new `AuthenticationDetail`
     * object.
     *
     * This method makes it convenient to convert random objects (from HTTP
     * responses or Mongoose responses) to an object of the proper class.
     *
     * @param obj The object to be parsed.
     * @returns A new `AuthenticationDetail` object, or null if obj is `null`
     * or `undefined`.
     */
    public static fromObject(obj: any): AuthenticationDetail {
        if (!obj) {
            return null;
        }
        return new AuthenticationDetail(
            AuthenticationMethod[obj.method],
            obj.value
        );
    }
}
