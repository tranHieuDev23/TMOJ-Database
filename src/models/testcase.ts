/**
 * A single test case for a problem.
 */
export class TestCase {
    constructor(
        /**
         * The id of the test case.
         */
        public testCaseId: string,
        /**
         * The file name of the file containing input data for the problem on
         * the judge server.
         *
         * With proper syncing, this file should be on the judge server before
         * the time of judgement.
         */
        public inputFile: string,
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
        public outputFile: string,
        /**
         * Whether the test should be displayed or hidden on the submission UI.
         */
        public isHidden: boolean,
        /**
         * The maximum score of this test case.
         *
         * Partial score can be enabled depending on the checker program.
         */
        public score: number
    ) {}

    /**
     * Parsing a random Javascript Object, and return a new `TestCase` object.
     *
     * This method makes it convenient to convert random objects (from HTTP
     * responses or Mongoose responses) to an object of the proper class.
     *
     * @param obj The object to be parsed.
     * @returns A new `TestCase` object, or null if obj is `null` or `undefined`.
     */
    public static fromObject(obj: any): TestCase {
        if (!obj) {
            return null;
        }
        return new TestCase(
            obj.testCaseId,
            obj.inputFile,
            obj.outputFile,
            obj.isHidden,
            obj.score
        );
    }
}
