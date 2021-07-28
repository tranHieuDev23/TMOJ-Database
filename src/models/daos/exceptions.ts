import { AuthenticationMethod } from "../authentication-detail";

export class TmojDatabaseNotFoundError extends Error {}

export class UserNotFoundError extends TmojDatabaseNotFoundError {
    constructor(public readonly username: string) {
        super(`Cannot find any user with the provided username: ${username}`);
    }
}

export class AuthenticationDetailNotFoundError extends TmojDatabaseNotFoundError {
    constructor(
        public readonly username: string,
        public readonly method: AuthenticationMethod
    ) {
        super(
            `Cannot find authentication detail for user ${username} with the method ${method.valueOf()}`
        );
    }
}

export class ProblemNotFoundError extends TmojDatabaseNotFoundError {
    constructor(public readonly problemId: string) {
        super(
            `Cannot find any problem with the provided problemId: ${problemId}`
        );
    }
}

export class TestCaseNotFoundError extends TmojDatabaseNotFoundError {
    constructor(public readonly testCaseId: string) {
        super(
            `Cannot find any testcase with the provided testCaseId: ${testCaseId}`
        );
    }
}

export class ContestNotFoundError extends TmojDatabaseNotFoundError {
    constructor(public readonly contestId: string) {
        super(
            `Cannot find any contest with the provided contestId: ${contestId}`
        );
    }
}

export class AnnouncementNotFoundError extends TmojDatabaseNotFoundError {
    constructor(public readonly announcementId: string) {
        super(
            `Cannot find any announcement with the provided announcementId: ${announcementId}`
        );
    }
}

export class SubmissionNotFoundError extends TmojDatabaseNotFoundError {
    constructor(public readonly submissionId: string) {
        super(
            `Cannot find any submission with the provided submissionId: ${submissionId}`
        );
    }
}

export class CollectionNotFoundError extends TmojDatabaseNotFoundError {
    constructor(public readonly collectionId: string) {
        super(
            `Cannot find any collection with the provided collectionId: ${collectionId}`
        );
    }
}
