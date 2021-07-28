import {
    AuthenticationDetail,
    AuthenticationMethod,
} from "../authentication-detail";
import mongoose from "./database";
import {
    AuthenticationDetailNotFoundError,
    UserNotFoundError,
} from "./exceptions";
import { AuthenticationDetailModel, UserModel } from "./models";

export class AuthenticationDetailDao {
    private constructor() {}

    private static readonly INSTANCE = new AuthenticationDetailDao();

    public static getInstance(): AuthenticationDetailDao {
        return AuthenticationDetailDao.INSTANCE;
    }

    public async getAuthenticationDetail(
        username: string,
        method: AuthenticationMethod
    ): Promise<AuthenticationDetail> {
        const userDocument = await UserModel.findOne({ username })
            .populate("authenticationDetails")
            .exec();
        if (userDocument === null) {
            return null;
        }

        const authenticationDetails =
            userDocument.authenticationDetails as any[];
        const methodDetail = authenticationDetails.find(
            (item) => item.method === method.valueOf()
        );
        if (methodDetail === undefined) {
            return null;
        }

        return new AuthenticationDetail(
            AuthenticationMethod[method],
            methodDetail.value
        );
    }

    public async addAuthenticationDetail(
        username: string,
        detail: AuthenticationDetail
    ): Promise<void> {
        const session = await mongoose.startSession();
        await session.withTransaction(async () => {
            const userDocument = await UserModel.findOne({ username }).exec();
            if (userDocument === null) {
                throw new UserNotFoundError(username);
            }
            await AuthenticationDetailModel.create({
                ofUserId: userDocument._id,
                method: detail.method.valueOf(),
                value: detail.value,
            });
        });
        session.endSession();
    }

    public async updateAuthenticationDetail(
        username: string,
        detail: AuthenticationDetail
    ): Promise<void> {
        const session = await mongoose.startSession();
        await session.withTransaction(async () => {
            const userDocument = await UserModel.findOne({ username }).exec();
            if (userDocument === null) {
                throw new UserNotFoundError(username);
            }

            const conditions = {
                ofUserId: userDocument._id,
                method: detail.method.valueOf(),
            };
            const detailDocument = await AuthenticationDetailModel.findOne(
                conditions
            ).exec();
            if (detailDocument === null) {
                throw new AuthenticationDetailNotFoundError(
                    username,
                    detail.method
                );
            }

            detailDocument.value = detail.value;
            await detailDocument.save();
        });
        session.endSession();
    }

    public async deleteAuthenticationDetail(
        username: string,
        method: AuthenticationMethod
    ): Promise<void> {
        const session = await mongoose.startSession();
        await session.withTransaction(async () => {
            const userDocument = await UserModel.findOne({ username }).exec();
            if (userDocument === null) {
                throw new UserNotFoundError(username);
            }
            const conditions = {
                ofUserId: userDocument._id,
                method: method.valueOf(),
            };
            const deletedDocument = await AuthenticationDetailModel.deleteMany(
                conditions
            );
            if (deletedDocument.deletedCount === 0) {
                throw new AuthenticationDetailNotFoundError(username, method);
            }
        });
        session.endSession();
    }
}
