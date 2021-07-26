import {
    AuthenticationDetail,
    AuthenticationMethod,
} from "../authentication-detail";
import mongoose from "./database";
import { AuthenticationDetailModel, UserModel } from "./models";

export class NoSuchUserError extends Error {
    constructor(public readonly username: string) {
        super(`No user with the provided username was found: ${username}`);
    }
}

export class NoSuchAuthenticationDetailError extends Error {
    constructor(
        public readonly username: string,
        public readonly method: AuthenticationMethod
    ) {
        super(
            `No authentication detail for user ${username} with the method ${method.valueOf()} was found`
        );
    }
}

export class AuthenticationDetailDao {
    private readonly AuthenticationDetailModel = AuthenticationDetailModel;
    private readonly UserModel = UserModel;

    private constructor() {}

    private static readonly INSTANCE = new AuthenticationDetailDao();

    public static getInstance(): AuthenticationDetailDao {
        return AuthenticationDetailDao.INSTANCE;
    }

    public async getAuthenticationDetail(
        username: string,
        method: AuthenticationMethod
    ): Promise<AuthenticationDetail> {
        const userDocument = await this.UserModel.findOne({
            username,
        })
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
            const userDocument = await this.UserModel.findOne({
                username,
            }).exec();
            if (userDocument === null) {
                throw new NoSuchUserError(username);
            }
            await this.AuthenticationDetailModel.create({
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
            const userDocument = await this.UserModel.findOne({
                username,
            }).exec();
            if (userDocument === null) {
                throw new NoSuchUserError(username);
            }

            const conditions = {
                ofUserId: userDocument._id,
                method: detail.method.valueOf(),
            };
            const detailDocument = await this.AuthenticationDetailModel.findOne(
                conditions
            ).exec();
            if (detailDocument === null) {
                throw new NoSuchAuthenticationDetailError(
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
            const userDocument = await this.UserModel.findOne({
                username,
            }).exec();
            if (userDocument === null) {
                throw new NoSuchUserError(username);
            }

            const conditions = {
                ofUserId: userDocument._id,
                method: method.valueOf(),
            };
            const deletedDocument =
                await this.AuthenticationDetailModel.deleteMany(conditions);
            if (deletedDocument.deletedCount === 0) {
                throw new NoSuchAuthenticationDetailError(username, method);
            }
        });
        session.endSession();
    }
}
