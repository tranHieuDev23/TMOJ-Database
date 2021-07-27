import { User } from "../user";
import { UserModel } from "./models";

export class UserDao {
    private constructor() {}

    private static readonly INSTANCE = new UserDao();

    public static getInstance(): UserDao {
        return UserDao.INSTANCE;
    }

    public async getUser(username: string): Promise<User> {
        const document = await UserModel.findOne({ username }).exec();
        if (document === null) {
            return null;
        }
        return User.fromObject(document);
    }

    public async addUser(user: User): Promise<User> {
        const newDocument = await UserModel.create({
            username: user.username,
            displayName: user.displayName,
        });
        return User.fromObject(newDocument);
    }

    public async updateUser(user: User): Promise<User> {
        const conditions = { username: user.username };
        // Update everything except for the username
        delete user.username;
        const updatedDocument = await UserModel.findOneAndUpdate(
            conditions,
            user
        ).exec();

        if (updatedDocument === null) {
            return null;
        }
        return User.fromObject(updatedDocument);
    }

    public async deleteUser(username: string): Promise<number> {
        const deletedDocument = await UserModel.deleteOne({ username });
        return deletedDocument.deletedCount;
    }
}
