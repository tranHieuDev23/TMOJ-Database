import { Router } from "express";
import asyncHandler from "express-async-handler";
import { StatusCodes } from "http-status-codes";
import { CollectionDao } from "../models/daos/collections";
import { CollectionFilterOptions, CollectionBase } from "../models/collection";
import { CollectionNotFoundError } from "../models/daos/exceptions";

const collectionDao = CollectionDao.getInstance();

export const collectionRouter = Router();

collectionRouter.post(
    "/",
    asyncHandler(async (req, res) => {
        const requestedCollection = req.body as CollectionBase;
        const newCollection = await collectionDao.addCollection(
            requestedCollection
        );
        const newLocation = `${req.originalUrl}${requestedCollection.collectionId}`;
        res.setHeader("Location", newLocation);
        return res.status(StatusCodes.CREATED).json(newCollection);
    })
);

collectionRouter.post(
    "/:collectionId/problems",
    asyncHandler(async (req, res) => {
        const collectionId = req.params.collectionId;
        const problemId = req.body.problemId;
        await collectionDao.addCollectionProblem(collectionId, problemId);
        return res.status(StatusCodes.OK).send();
    })
);

collectionRouter.get(
    "/",
    asyncHandler(async (req, res) => {
        const filterOptions = req.body.filterOptions as CollectionFilterOptions;
        const asUser = req.body.asUser as string;
        const collections = await collectionDao.getCollectionList(
            filterOptions,
            asUser
        );
        filterOptions.startIndex = 0;
        filterOptions.itemCount = null;
        const totalItemCount = await collectionDao.getCollectionListCount(
            filterOptions,
            asUser
        );
        return res.status(StatusCodes.OK).json({ totalItemCount, collections });
    })
);

collectionRouter.get(
    "/:collectionId",
    asyncHandler(async (req, res) => {
        const collectionId = req.params.collectionId;
        const collection = await collectionDao.getCollection(collectionId);
        if (collection === null) {
            throw new CollectionNotFoundError(collectionId);
        }
        return res.status(StatusCodes.OK).json(collection);
    })
);

collectionRouter.get(
    "/:collectionId/problems",
    asyncHandler(async (req, res) => {
        const collectionId = req.params.collectionId;
        const collection = await collectionDao.getCollection(
            collectionId,
            true
        );
        if (collection === null) {
            throw new CollectionNotFoundError(collectionId);
        }
        // We don't need information about test cases in problems when sending
        // with collections.
        const problems = collection.problems.map((item) => {
            delete item.testCases;
            return item;
        });
        return res.status(StatusCodes.OK).json(problems);
    })
);

collectionRouter.patch(
    "/:collectionId",
    asyncHandler(async (req, res) => {
        const collectionId = req.params.collectionId;
        const requestedCollection = req.body as CollectionBase;
        requestedCollection.collectionId = collectionId;
        const collection = await collectionDao.updateCollection(
            requestedCollection
        );
        if (collection === null) {
            throw new CollectionNotFoundError(collectionId);
        }
        return res.status(StatusCodes.OK).json(collection);
    })
);

collectionRouter.delete(
    "/:collectionId",
    asyncHandler(async (req, res) => {
        const collectionId = req.params.collectionId;
        const deletedCount = await collectionDao.deleteCollection(collectionId);
        if (deletedCount === 0) {
            throw new CollectionNotFoundError(collectionId);
        }
        return res.status(StatusCodes.OK).send();
    })
);

collectionRouter.delete(
    "/:collectionId/problems/:problemId",
    asyncHandler(async (req, res) => {
        const { collectionId, problemId } = req.params;
        await collectionDao.removeCollectionProblem(collectionId, problemId);
        return res.status(StatusCodes.OK).send();
    })
);
