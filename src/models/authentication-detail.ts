/**
 * Methods to authenticate an user.
 * 
 * Currently, we only support password-based authentication. Future version
 * should support OAuth2.
 */
export enum AuthenticationMethod {
    Password = "Password"
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
    constructor(
        public readonly method: AuthenticationMethod,
        public readonly value: string
    ) {}
}