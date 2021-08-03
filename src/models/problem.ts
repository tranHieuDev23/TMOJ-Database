import { TestCase } from "./testcase";
import { User } from "./user";

/**
 * Some built-in checker program supported by TMOJ.
 */
export enum ProblemChecker {
    /**
     * Read the expected output file and the submission's output file at the
     * same time, string-by-string, split by whitespace. The submission is
     * Accepted if both files match each other.
     *
     * Leading, trailing and excessive whitespace will not affect the final
     * verdict.
     */
    EqualChecker = "EqualChecker",
    /**
     * Similar to `EqualChecker`, but allow the two files to have characters of
     * different cases.
     */
    CaseInsensitiveEqualChecker = "CaseInsensitiveEqualChecker",
}

export const STDIO = "stdio";

/**
 * A Problem on the TMOJ platform.
 */
export class Problem {
    constructor(
        /**
         * The id of the problem.
         */
        public problemId: string,
        /**
         * The user who posted the problem.
         */
        public author: User,
        /**
         * The full name of the problem to be displayed on the UI.
         *
         * Can be any non-empty string upto 128 character long, with no leading
         * or trailing whitespace.
         */
        public displayName: string,
        /**
         * The time this problem was created on the system.
         */
        public creationDate: Date,
        /**
         * Whether this problem should be public for every user to view or
         * not.
         */
        public isPublic: boolean,
        /**
         * The time limit of the problem in milliseconds.
         *
         * For convenience, four constant values `HALF_A_SECOND`, `ONE_SECOND`,
         * `TWO_SECOND` and `FIVE_SECOND` can be imported from `unit.ts` and
         * used as value of this field.
         */
        public timeLimit: number,
        /**
         * The memory limit of the problem in MB.
         *
         * For convenience, two constant values `MB` and `GB` can be
         * imported from `unit.ts` and used as value of this field.
         */
        public memoryLimit: number,
        /**
         * The location where solution programs should look for the input.
         *
         * If the value of this field is the constant `STDIO`, solutions should
         * read from the standard input stream (stdin). Otherwise, solutions
         * should read from the text file specified by this field.
         */
        public inputSource: string,
        /**
         * The location where solution programs should write the output.
         *
         * If the value of this field is the constant `STDIO`, solutions should
         * write to the standard output stream (stdout). Otherwise, solutions
         * should create and write to the text file specified by this field.
         */
        public outputSource: string,
        /**
         * The checker program used for this problem.
         *
         * If the field is one of the defined value in `ProblemChecker` enum,
         * the judge will use the corresponding built-in checker. Otherwise,
         * this field should be the file name of the custom checker program on
         * the judge server. With proper syncing, this file should be on the
         * judge server before the time of judgement.
         *
         * This field should be `delete`d before sending to the front-end,
         * because there is no point letting the client know about this.
         */
        public checker: ProblemChecker | string,
        /**
         * The list of test cases of this problem.
         *
         * When not needed, this field should be `delete`d before sending to
         * the front-end to save bandwidth.
         */
        public testCases: TestCase[]
    ) {}

    /**
     * Parsing a random Javascript Object, and return a new `Problem` object.
     *
     * This method makes it convenient to convert random objects (from HTTP
     * responses or Mongoose responses) to an object of the proper class.
     *
     * @param obj The object to be parsed.
     * @returns A new `Problem` object, or null if obj is `null` or `undefined`.
     */
    public static fromObject(obj: any): Problem {
        if (!obj) {
            return null;
        }
        const testCases = obj.testCases
            ? (obj.testCases as any[])
                  .filter((item) => item !== null)
                  .map((item) => TestCase.fromObject(item))
            : [];
        return new Problem(
            obj.problemId,
            User.fromObject(obj.author),
            obj.displayName,
            new Date(obj.creationDate),
            obj.isPublic,
            obj.timeLimit,
            obj.memoryLimit,
            obj.inputSource,
            obj.outputSource,
            obj.checker,
            testCases
        );
    }
}

/**
 * Options to filter for problems in a list.
 */
export class ProblemFilterOptions {
    /**
     * Index of the first element in the result list, relative to the total
     * result list.
     *
     * Default to 0.
     */
    public startIndex: number = 0;
    /**
     * The number of elements to return.
     *
     * Default to `null` (return as many elements as possible).
     */
    public itemCount: number = null;
    /**
     * A list of usernames of authors to include.
     *
     * Default to `null` (no filter).
     */
    public author: string[] = null;
    /**
     * If equal to `null`, apply no filter to creation time.
     *
     * If equal to an array of two `Date` objects, the creation time of the
     * problem must lie between the two `Date` objects' value.
     *
     * If one of the two objects is equal to `null`, that end is not bounded.
     *
     * Default to `null` (no filter).
     */
    public creationDate: Date[] = null;
    /**
     * If not `null`, filter for problems with the specified `isPublic`
     * value.
     *
     * Default to `null` (no filter).
     */
    public isPublic: boolean = null;
    /**
     * Sort orders within the search result.
     *
     * Default to `[{field: "creationDate", ascending: false}]`.
     */
    public sortFields: { field: string; ascending: boolean }[] = [
        { field: "creationDate", ascending: false },
    ];
}

/**
 * Basic information needed to add or update a Problem.
 */
export class ProblemBase {
    constructor(
        public problemId: string,
        public authorUsername: string,
        public displayName: string,
        public creationDate: Date,
        public isPublic: boolean,
        public timeLimit: number,
        public memoryLimit: number,
        public inputSource: string,
        public outputSource: string,
        public checker: ProblemChecker | string
    ) {}
}
