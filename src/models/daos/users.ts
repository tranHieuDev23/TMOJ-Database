import { User } from "../user";
import { UserModel } from "./models";

export class UserDao {
    private readonly UserModel = UserModel;

    private constructor() {}

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
        ).exec();

        if (updatedDocument === null) {
            return null;
        }
        return new User(updatedDocument.username, updatedDocument.displayName);
    }

    public async deleteUser(username: string): Promise<number> {
        const deletedDocument = await this.UserModel.deleteOne({ username });
        return deletedDocument.deletedCount;
    }
}
