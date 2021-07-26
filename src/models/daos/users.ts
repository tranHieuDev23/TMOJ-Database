import mongoose from "./database";
import mongooseUniqueValidator from "mongoose-unique-validator";
import { User } from "../user";

const { Schema } = mongoose;

export class UserDao {
    private readonly UserModel: any;

    private constructor() {
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
                maxLength: [
                    64,
                    "Display name should not be longer than 64 characters",
                ],
            },
        });
        userSchema.plugin(mongooseUniqueValidator, {
            message: "Error, expected {PATH} to be unique.",
        });
        userSchema.path("displayName").set((value: string) => {
            return value.trim();
        });

        this.UserModel = mongoose.model("UserModel", userSchema, "users");
    }

    private static readonly INSTANCE = new UserDao();

    public static getInstance(): UserDao {
        return UserDao.INSTANCE;
    }

    public async getUser(username: string): Promise<User> {
        const document = await this.UserModel.findOne({ username }).exec();
        if (document === null) {
            return null;
        }
        return new User(document.username, document.displayName);
    }

    public async addUser(user: User): Promise<User> {
        const newDocument = await this.UserModel.create({
            username: user.username,
            displayName: user.displayName,
        });
        return new User(newDocument.username, newDocument.displayName);
    }
    public async updateUser(user: User): Promise<User> {
        const conditions = { username: user.username };
        const updates = {
            displayName: user.displayName,
        };
        const updatedDocument = await this.UserModel.findOneAndUpdate(
            conditions,
            updates,
            { new: true, runValidators: true, context: "query" }
        );

        if (updatedDocument === null) {
            return null;
        }
        return new User(updatedDocument.username, updatedDocument.displayName);
    }

    public async deleteUser(username: string): Promise<User> {
        const deletedDocument = await this.UserModel.deleteOne({ username });
        if (deletedDocument === null) {
            return null;
        }
        return new User(deletedDocument.username, deletedDocument.displayName);
    }
}
