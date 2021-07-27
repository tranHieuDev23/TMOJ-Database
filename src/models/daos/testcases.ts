import { TestCase } from "../testcase";
import { TestCaseModel } from "./models";

export class TestCaseDao {
    private constructor() {}

    private static readonly INSTANCE = new TestCaseDao();

    public static getInstance(): TestCaseDao {
        return TestCaseDao.INSTANCE;
    }

    public async getTestCase(testCaseId: string): Promise<TestCase> {
        const document = await TestCaseModel.findOne({ testCaseId }).exec();
        if (document === null) {
            return null;
        }
        return TestCase.fromObject(document);
    }

    public async addTestCase(testCase: TestCase): Promise<TestCase> {
        const newDocument = await TestCaseModel.create({
            testCaseId: testCase.testCaseId,
            inputFile: testCase.inputFile,
            outputFile: testCase.outputFile,
            isPretest: testCase.isPretest,
            isHidden: testCase.isHidden,
            score: testCase.score,
        });
        return TestCase.fromObject(newDocument);
    }

    public async updateTestCase(testCase: TestCase): Promise<TestCase> {
        const { testCaseId } = testCase;
        // Update everything except for the id
        delete testCase.testCaseId;
        const updatedDocument = await TestCaseModel.findOneAndUpdate(
            { testCaseId },
            testCase
        ).exec();
        if (updatedDocument === null) {
            return null;
        }
        return TestCase.fromObject(updatedDocument);
    }

    public async deleteTestCase(testCaseId: string): Promise<number> {
        const deletedDocument = await TestCaseModel.deleteOne({ testCaseId });
        return deletedDocument.deletedCount;
    }
}
