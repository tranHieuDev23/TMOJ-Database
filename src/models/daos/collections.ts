import {
    Collection,
    CollectionFilterOptions,
    CollectionBase,
} from "../collection";
import mongoose from "./database";
import {
    CollectionNotFoundError,
    ProblemNotFoundError,
    UserNotFoundError,
} from "./exceptions";
import { CollectionModel, ProblemModel, UserModel } from "./models";

function filterQuery(options: CollectionFilterOptions) {
    const conditions = {};
    if (options.owner) {
        conditions["ownerUsername"] = {
            $in: options.owner,
        };
    }
    if (options.creationDate) {
        const creationDateCondition = {};
        if (options.creationDate[0] !== null) {
            creationDateCondition["$gte"] = options.creationDate[0];
        }
        if (options.creationDate[1] !== null) {
            creationDateCondition["$lte"] = options.creationDate[1];
        }
        conditions["creationDate"] = creationDateCondition;
    }
    if (options.isPublic !== undefined && options.isPublic !== null) {
        conditions["isPublic"] = options.isPublic;
    }
    let query = CollectionModel.find(conditions);
    if (options.sortFields) {
        const sortCondition = {};
        for (const item of options.sortFields) {
            sortCondition[item.field] = item.ascending ? 1 : -1;
        }
        query = query.sort(sortCondition);
    }
    if (options.startIndex !== 0) {
        query = query.skip(options.startIndex);
    }
    if (options.itemCount !== null) {
        query = query.limit(options.itemCount);
    }
    return query;
}

async function documentToCollection(
    document: any,
    includeProblems: boolean = false
): Promise<Collection> {
    document = document.populate("owner");
    if (includeProblems) {
        document = document.populate({
            path: "problems",
            populate: {
                path: "author",
            },
        });
    }
    const collection = Collection.fromObject(await document.execPopulate());
    if (!includeProblems) {
        delete collection.problems;
    }
    return collection;
}

export class CollectionDao {
    private constructor() {}

    private static readonly INSTANCE = new CollectionDao();

    public static getInstance(): CollectionDao {
        return CollectionDao.INSTANCE;
    }

    public async getCollection(
        collectionId: string,
        includeProblems: boolean = false
    ): Promise<Collection> {
        const document = await CollectionModel.findOne({ collectionId }).exec();
        if (document === null) {
            return null;
        }
        return await documentToCollection(document, includeProblems);
    }

    public async getCollectionList(
        filterOptions: CollectionFilterOptions = new CollectionFilterOptions(),
        asUser: string = undefined,
        includeProblems: boolean = false
    ): Promise<Collection[]> {
        let query = filterQuery(filterOptions);
        if (asUser !== undefined) {
            query = query.find({
                $or: [
                    {
                        ownerUsername: asUser,
                    },
                    {
                        isPublic: true,
                    },
                ],
            });
        }
        const documents = await query.exec();
        const results = await Promise.all(
            documents.map((item) => documentToCollection(item, includeProblems))
        );
        return results;
    }

    public async addCollection(
        collection: CollectionBase
    ): Promise<Collection> {
        return new Promise<Collection>(async (resolve, reject) => {
            try {
                const session = await mongoose.startSession();
                await session.withTransaction(async () => {
                    const username = collection.ownerUsername;
                    const userDocument = await UserModel.findOne({
                        username,
                    }).exec();
                    if (userDocument === null) {
                        throw new UserNotFoundError(username);
                    }
                    const collectionDocument = await CollectionModel.create({
                        collectionId: collection.collectionId,
                        owner: userDocument._id,
                        ownerUsername: username,
                        displayName: collection.displayName,
                        creationDate: collection.creationDate,
                        description: collection.description,
                        isPublic: collection.isPublic,
                    });
                    resolve(await documentToCollection(collectionDocument));
                });
                session.endSession();
            } catch (e) {
                reject(e);
            }
        });
    }

    public async updateCollection(
        collection: CollectionBase
    ): Promise<Collection> {
        const { collectionId } = collection;
        // Update everything except for the id and the owner
        delete collection.collectionId;
        delete collection.ownerUsername;
        const updatedDocument = await CollectionModel.findOneAndUpdate(
            { collectionId },
            collection
        ).exec();
        if (updatedDocument === null) {
            return null;
        }
        return await documentToCollection(updatedDocument);
    }

    public async addCollectionProblem(
        collectionId: string,
        problemId: string
    ): Promise<void> {
        const session = await mongoose.startSession();
        await session.withTransaction(async () => {
            const collectionDocument = await CollectionModel.findOne({
                collectionId,
            }).exec();
            if (collectionDocument === null) {
                throw new CollectionNotFoundError(collectionId);
            }
            const problemDocument = await ProblemModel.findOne({
                problemId,
            }).exec();
            if (problemDocument === null) {
                throw new ProblemNotFoundError(problemId);
            }
            await collectionDocument.update({
                $addToSet: { problems: problemDocument._id },
            });
        });
        session.endSession();
    }

    public async removeCollectionProblem(
        collectionId: string,
        problemId: string
    ): Promise<void> {
        const session = await mongoose.startSession();
        await session.withTransaction(async () => {
            const collectionDocument = await CollectionModel.findOne({
                collectionId,
            }).exec();
            if (collectionDocument === null) {
                throw new CollectionNotFoundError(collectionId);
            }
            const problemDocument = await ProblemModel.findOne({
                problemId,
            }).exec();
            if (problemDocument === null) {
                throw new ProblemNotFoundError(problemId);
            }
            await collectionDocument.update({
                $pull: { problems: problemDocument._id },
            });
        });
        session.endSession();
    }

    public async deleteCollection(collectionId: string): Promise<number> {
        const deletedDocument = await CollectionModel.deleteOne({
            collectionId,
        });
        return deletedDocument.deletedCount;
    }
}
