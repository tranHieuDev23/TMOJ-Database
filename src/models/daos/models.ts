import mongoose from "./database";
import mongooseUniqueValidator from "mongoose-unique-validator";
import {
    AuthenticationMethod,
    getAllAuthenticationMethods,
} from "../authentication-detail";
import { ContestFormat, getAllContestFormats } from "../contest";
import {
    hashPasswordMiddleware,
    trimStringSetter,
} from "../../util/database-utils";
import {
    getAllSubmissionLanguages,
    getAllSubmissionStatuses,
} from "../submission";

const { Schema, Types } = mongoose;

const userSchema = new Schema<any>({
    username: {
        type: String,
        required: true,
        unique: true,
        minLength: [6, "username too short"],
        maxLength: [32, "username too long"],
        match: /^[a-zA-Z\d_]{6,32}$/,
    },
    displayName: {
        type: String,
        required: true,
        set: trimStringSetter,
        minLength: [1, "Display name should not be empty"],
        maxLength: [64, "Display name should not be longer than 64 characters"],
    },
});
userSchema.virtual("authenticationDetails", {
    ref: "AuthenticationDetailModel",
    localField: "_id",
    foreignField: "ofUserId",
});
userSchema.plugin(mongooseUniqueValidator, {
    message: "Expected {PATH} to be unique.",
});

const authenticationDetailSchema = new Schema<any>({
    ofUserId: {
        type: Types.ObjectId,
        ref: "UserModel",
        required: true,
    },
    method: {
        type: String,
        required: true,
        enum: getAllAuthenticationMethods(),
    },
    value: {
        type: String,
        required: true,
    },
});
authenticationDetailSchema.pre("save", hashPasswordMiddleware);

const problemSchema = new Schema<any>({
    problemId: {
        type: String,
        required: true,
        unique: true,
    },
    author: {
        type: Types.ObjectId,
        ref: "UserModel",
        required: true,
    },
    authorUsername: {
        type: String,
        required: true,
    },
    displayName: {
        type: String,
        required: true,
        set: trimStringSetter,
        minLength: [1, "Display name should not be empty"],
        maxLength: [
            128,
            "Display name should not be longer than 128 characters",
        ],
    },
    isPublic: {
        type: Boolean,
        required: true,
    },
    timeLimit: {
        type: Number,
        required: true,
        min: [100, "Time limit must be at least 0.1 second"],
    },
    memoryLimit: {
        type: Number,
        required: true,
        min: [16, "Memory limit must be at least 16 MB"],
    },
    inputSource: {
        type: String,
        required: true,
        minLength: [1, "Input source must be specified"],
    },
    outputSource: {
        type: String,
        required: true,
        minLength: [1, "Output source must be specified"],
    },
    checker: {
        type: String,
        required: true,
        minLength: [1, "Checker must be specified"],
    },
    testCases: {
        type: [Types.ObjectId],
        ref: "TestCaseModel",
    },
});
problemSchema.plugin(mongooseUniqueValidator, {
    message: "Expected {PATH} to be unique.",
});

const testCaseSchema = new Schema<any>({
    testCaseId: {
        type: String,
        required: true,
        unique: true,
    },
    inputFile: {
        type: String,
        required: true,
        minLength: [1, "Input file must be specified"],
    },
    outputFile: {
        type: String,
        required: true,
        minLength: [1, "Output file must be specified"],
    },
    isPretest: {
        type: Boolean,
        required: true,
    },
    isHidden: {
        type: Boolean,
        required: Boolean,
    },
    score: {
        type: Number,
        required: true,
        min: [0, "Score must be non-negative"],
    },
});
testCaseSchema.plugin(mongooseUniqueValidator, {
    message: "Expected {PATH} to be unique.",
});

const contestSchema = new Schema<any>({
    contestId: {
        type: String,
        required: true,
        unique: true,
    },
    organizer: {
        type: Types.ObjectId,
        ref: "UserModel",
        required: true,
    },
    organizerUsername: {
        type: String,
        required: true,
    },
    displayName: {
        type: String,
        required: true,
        set: trimStringSetter,
        minLength: [1, "Display name should not be empty"],
        maxLength: [
            128,
            "Display name should not be longer than 128 characters",
        ],
    },
    format: {
        type: String,
        required: true,
        enum: getAllContestFormats(),
    },
    startTime: {
        type: Date,
        required: true,
    },
    duration: {
        type: Number,
        required: true,
        min: [300000, "Contest must be at least 5 minute long"],
    },
    description: {
        type: String,
        required: true,
        set: trimStringSetter,
    },
    problems: {
        type: [Types.ObjectId],
        ref: "ProblemModel",
    },
    participants: {
        type: [Types.ObjectId],
        ref: "UserModel",
    },
});
contestSchema.virtual("announcements", {
    ref: "AnnouncementModel",
    localField: "_id",
    foreignField: "ofContestId",
});
contestSchema.plugin(mongooseUniqueValidator, {
    message: "Expected {PATH} to be unique.",
});

const announcementSchema = new Schema<any>({
    announcementId: {
        type: String,
        required: true,
        unique: true,
    },
    ofContestId: {
        type: Types.ObjectId,
        ref: "ContestModel",
        required: true,
    },
    timestamp: {
        type: Date,
        required: true,
    },
    subject: {
        type: String,
        required: true,
        set: trimStringSetter,
    },
    content: {
        type: String,
        required: true,
        set: trimStringSetter,
    },
});
announcementSchema.plugin(mongooseUniqueValidator, {
    message: "Expected {PATH} to be unique.",
});

const submissionSchema = new Schema<any>({
    submissionId: {
        type: String,
        required: true,
        unique: true,
    },
    author: {
        type: Types.ObjectId,
        required: true,
        ref: "UserModel",
    },
    problem: {
        type: Types.ObjectId,
        required: true,
        ref: "ProblemModel",
    },
    contest: {
        type: Types.ObjectId,
        ref: "ContestModel",
    },
    sourceFile: {
        type: String,
        required: true,
    },
    language: {
        type: String,
        required: true,
        enum: getAllSubmissionLanguages(),
    },
    submissionTime: {
        type: Date,
        required: true,
    },
    status: {
        type: String,
        required: true,
        enum: getAllSubmissionStatuses(),
    },
    score: {
        type: Number,
        min: 0,
    },
    failedTestCase: {
        type: Types.ObjectId,
        ref: "TestCaseModel",
    },
    log: {
        type: String,
    },
});
submissionSchema.plugin(mongooseUniqueValidator, {
    message: "Expected {PATH} to be unique.",
});

const collectionSchema = new Schema<any>({
    collectionId: {
        type: String,
        required: true,
        unique: true,
    },
    owner: {
        type: Types.ObjectId,
        ref: "UserModel",
        required: true,
    },
    ownerUsername: {
        type: String,
        required: true,
    },
    displayName: {
        type: String,
        required: true,
        set: trimStringSetter,
        minLength: [1, "Display name should not be empty"],
        maxLength: [
            128,
            "Display name should not be longer than 128 characters",
        ],
    },
    description: {
        type: String,
        required: true,
        set: trimStringSetter,
    },
    isPublic: {
        type: Boolean,
        required: true,
    },
    problems: {
        type: [Types.ObjectId],
        ref: "ProblemModel",
    },
});
collectionSchema.plugin(mongooseUniqueValidator, {
    message: "Expected {PATH} to be unique.",
});

export const UserModel = mongoose.model<any>("UserModel", userSchema, "users");
export const AuthenticationDetailModel = mongoose.model<any>(
    "AuthenticationDetailModel",
    authenticationDetailSchema,
    "authenticationDetails"
);
export const ProblemModel = mongoose.model<any>(
    "ProblemModel",
    problemSchema,
    "problems"
);
export const TestCaseModel = mongoose.model<any>(
    "TestCaseModel",
    testCaseSchema,
    "testCases"
);
export const ContestModel = mongoose.model<any>(
    "ContestModel",
    contestSchema,
    "contests"
);
export const AnnouncementModel = mongoose.model<any>(
    "AnnouncementModel",
    announcementSchema,
    "announcements"
);
export const SubmissionModel = mongoose.model<any>(
    "SubmissionModel",
    submissionSchema,
    "submissions"
);
export const CollectionModel = mongoose.model<any>(
    "CollectionModel",
    collectionSchema,
    "collections"
);
