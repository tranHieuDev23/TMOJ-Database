import mongoose from "./database";
import mongooseUniqueValidator from "mongoose-unique-validator";
import { hashPassword } from "../../util/encryption";
import { AuthenticationMethod } from "../authentication-detail";

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
    message: "Error, expected {PATH} to be unique.",
});
userSchema.path("displayName").set((value: string) => {
    return value.trim();
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
        enum: [AuthenticationMethod.Password.valueOf()],
    },
    value: {
        type: String,
        required: true,
    },
});

async function hashPasswordMiddleware(next: any) {
    if (
        this.method === AuthenticationMethod.Password.valueOf() &&
        this.isModified("value")
    ) {
        try {
            const hashed = await hashPassword(this.value);
            this.value = hashed;
            return next();
        } catch (error) {
            return next(error);
        }
    }
    return next();
}
authenticationDetailSchema.pre("save", hashPasswordMiddleware);

export const UserModel = mongoose.model<any>("UserModel", userSchema, "users");
export const AuthenticationDetailModel = mongoose.model<any>(
    "AuthenticationDetailModel",
    authenticationDetailSchema,
    "authenticationDetails"
);
