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

/**
 * A Problem on the TMOJ platform.
 */
export class Problem {
    constructor(
        /**
         * The id of the problem.
         */
        public readonly problemId: string,
        /**
         * The user who posted the problem.
         */
        public readonly author: User,
        /**
         * The full name of the problem to be displayed on the UI.
         *
         * Can be any non-empty string upto 128 character long, with no leading
         * or trailing whitespace.
         */
        public readonly displayName: string,
        /**
         * The time limit of the problem in milliseconds.
         *
         * For convenience, four constant values `HALF_A_SECOND`, `ONE_SECOND`,
         * `TWO_SECOND` and `FIVE_SECOND` can be imported from `unit.ts` and
         * used as value of this field.
         */
        public readonly timeLimit: number,
        /**
         * The memory limit of the problem in kB.
         *
         * For convenience, three constant values `KB`, `MB` and `GB` can be
         * imported from `unit.ts` and used as value of this field.
         */
        public readonly memoryLimit: number,
        /**
         * The location where solution programs should look for the input.
         *
         * If the value of this field is the string `"stdio"`, solutions should
         * read from the standard input stream (stdin). Otherwise, solutions
         * should read from the text file specified by this field.
         */
        public readonly inputSource: string,
        /**
         * The location where solution programs should write the output.
         *
         * If the value of this field is the string `"stdio"`, solutions should
         * write to the standard output stream (stdout). Otherwise, solutions
         * should create and write to the text file specified by this field.
         */
        public readonly outputSource: string,
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
        public readonly checker: ProblemChecker | string,
        /**
         * The list of test cases of this problem.
         *
         * When not needed, this field should be `delete`d before sending to
         * the front-end to save bandwidth.
         */
        public readonly testCases: TestCase[]
    ) {}
}
