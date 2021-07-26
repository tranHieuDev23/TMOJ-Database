import mongoose from "./database";
import mongooseUniqueValidator from "mongoose-unique-validator";

const { Schema } = mongoose;

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
userSchema.plugin(mongooseUniqueValidator, {
    message: "Error, expected {PATH} to be unique.",
});
userSchema.path("displayName").set((value: string) => {
    return value.trim();
});

export const UserModel = mongoose.model<any>("UserModel", userSchema, "users");
