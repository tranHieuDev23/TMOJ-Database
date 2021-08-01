import { BlacklistedJwt } from "../blacklisted-jwt";
import { BlacklistedJwtModel } from "./models";

export class BlacklistedJwtDao {
    private constructor() {}

    private static readonly INSTANCE = new BlacklistedJwtDao();

    public static getInstance(): BlacklistedJwtDao {
        return BlacklistedJwtDao.INSTANCE;
    }

    public async getBlacklistedJwt(jwtId: string): Promise<BlacklistedJwt> {
        const document = await BlacklistedJwtModel.findOne({ jwtId }).exec();
        if (document === null) {
            return null;
        }
        return BlacklistedJwt.fromObject(document);
    }

    public async addBlacklistedJwt(
        blacklistedJwt: BlacklistedJwt
    ): Promise<BlacklistedJwt> {
        const newDocument = await BlacklistedJwtModel.create({
            jwtId: blacklistedJwt.jwtId,
            exp: blacklistedJwt.exp,
        });
        return BlacklistedJwt.fromObject(newDocument);
    }

    public async updateBlacklistedJwt(
        blacklistedJwt: BlacklistedJwt
    ): Promise<BlacklistedJwt> {
        const conditions = { jwtId: blacklistedJwt.jwtId };
        // Update everything except for the jwtId
        delete blacklistedJwt.jwtId;
        const updatedDocument = await BlacklistedJwtModel.findOneAndUpdate(
            conditions,
            blacklistedJwt
        ).exec();

        if (updatedDocument === null) {
            return null;
        }
        return BlacklistedJwt.fromObject(updatedDocument);
    }

    public async deleteBlacklistedJwt(jwtId: string): Promise<number> {
        const deletedDocument = await BlacklistedJwtModel.deleteOne({ jwtId });
        return deletedDocument.deletedCount;
    }
}
