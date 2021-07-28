import { Announcement } from "../announcement";
import mongoose from "./database";
import { ContestNotFoundError } from "./exceptions";
import { AnnouncementModel, ContestModel } from "./models";

export class AnnouncementDao {
    private constructor() {}

    private static readonly INSTANCE = new AnnouncementDao();

    public static getInstance(): AnnouncementDao {
        return AnnouncementDao.INSTANCE;
    }

    public async getAnnouncement(
        announcementId: string
    ): Promise<Announcement> {
        const document = await AnnouncementModel.findOne({
            announcementId,
        }).exec();
        if (document === null) {
            return null;
        }
        return Announcement.fromObject(document);
    }

    public async addAnnouncement(
        contestId: string,
        announcement: Announcement
    ): Promise<Announcement> {
        return new Promise<Announcement>(async (resolve, reject) => {
            try {
                const session = await mongoose.startSession();
                await session.withTransaction(async () => {
                    const contestDocument = await ContestModel.findOne({
                        contestId,
                    }).exec();
                    if (contestDocument === null) {
                        throw new ContestNotFoundError(contestId);
                    }
                    const announcementDocument = await AnnouncementModel.create(
                        {
                            announcementId: announcement.announcementId,
                            ofContestId: contestDocument._id,
                            timestamp: announcement.timestamp,
                            subject: announcement.subject,
                            content: announcement.content,
                        }
                    );
                    return resolve(
                        Announcement.fromObject(announcementDocument)
                    );
                });
                session.endSession();
            } catch (e) {
                reject(e);
            }
        });
    }

    public async updateAnnouncement(
        announcement: Announcement
    ): Promise<Announcement> {
        const { announcementId } = announcement;
        // Update everything except for the id
        delete announcement.announcementId;
        const updatedDocument = await AnnouncementModel.findOneAndUpdate(
            { announcementId },
            announcement
        ).exec();
        if (updatedDocument === null) {
            return null;
        }
        return Announcement.fromObject(updatedDocument);
    }

    public async deleteAnnouncement(announcementId: string): Promise<number> {
        const deletedDocument = await AnnouncementModel.deleteOne({
            announcementId,
        });
        return deletedDocument.deletedCount;
    }
}
