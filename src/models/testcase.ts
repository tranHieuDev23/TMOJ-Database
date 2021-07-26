/**
 * A single test case for a problem.
 */
export class TestCase {
    constructor(
        /**
         * The id of the test case.
         */
        public readonly testCaseId: string,
        /**
         * The file name of the file containing input data for the problem on
         * the judge server.
         *
         * With proper syncing, this file should be on the judge server before
         * the time of judgement.
         */
        public readonly inputFile: string,
        /**
         * The file name of the file containing expected output data for the
         * problem on the judge server.
         *
         * This file will be fed to the checker program, along with the
         * submission's output. This does NOT need be the full expected
         * output - for example, if there are many solutions that produce the
         * best value and the user only needs to output one of them, this file
         * can contain only the expected best value.
         *
         * With proper syncing, this file should be on the judge server before
         * the time of judgement.
         */
        public readonly outputFile: string,
        /**
         * Whether the test is a pretest.
         *
         * During the time of contest, submissions will only be judged against
         * a limited set of pretests. The rest of the test cases will only be
         * used after the contest finishes.
         */
        public readonly isPretest: boolean,
        /**
         * Whether the test should be displayed or hidden on the submission UI.
         */
        public readonly isHidden: boolean,
        /**
         * The maximum score of this test case.
         *
         * Partial score can be enabled depending on the checker program.
         */
        public readonly score: number
    ) {}
}
