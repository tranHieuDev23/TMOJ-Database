import { User } from "./user";
import { Problem } from "./problem";

/**
 * A collection of problems made by an `User` on the TMOJ platform.
 */
export class Collection {
    constructor(
        /**
         * The id of the collection.
         */
        public collectionId: string,
        /**
         * The user who made the collection.
         */
        public owner: User,
        /**
         * The full name of the collection to be displayed on the UI.
         *
         * Can be any non-empty string upto 128 character long, with no leading
         * or trailing whitespace.
         */
        public displayName: string,
        /**
         * The time this problem was created on the system.
         */
        public creationDate: Date,
        /**
         * The description text of the collection.
         *
         * Can be a HTML document of any length.
         */
        public description: string,
        /**
         * Whether this collection should be public for every user to view or
         * not.
         */
        public isPublic: boolean,
        /**
         * The list of problems in the collection, sorted by the owner.
         */
        public problems: Problem[]
    ) {}

    /**
     * Parsing a random Javascript Object, and return a new `Collection`
     * object.
     *
     * This method makes it convenient to convert random objects (from HTTP
     * responses or Mongoose responses) to an object of the proper class.
     *
     * @param obj The object to be parsed.
     * @returns A new `Collection` object, or null if obj is `null` or
     * `undefined`.
     */
    public static fromObject(obj: any): Collection {
        if (!obj) {
            return null;
        }
        const problems = obj.problems
            ? (obj.problems as any[])
                  .filter((item) => item !== null)
                  .map((item) => Problem.fromObject(item))
            : [];
        return new Collection(
            obj.collectionId,
            User.fromObject(obj.owner),
            obj.displayName,
            new Date(obj.creationDate),
            obj.description,
            obj.isPublic,
            problems
        );
    }
}

/**
 * Options to filter for collections in a list.
 */
export class CollectionFilterOptions {
    /**
     * Index of the first element in the result list, relative to the total
     * result list.
     *
     * Default to 0.
     */
    public startIndex: number = 0;
    /**
     * The number of elements to return.
     *
     * Default to `null` (return as many elements as possible).
     */
    public itemCount: number = null;
    /**
     * A list of usernames of owners to include.
     *
     * Default to `null` (no filter).
     */
    public owner: string[] = null;
    /**
     * If equal to `null`, apply no filter to creation time.
     *
     * If equal to an array of two `Date` objects, the creation time of the
     * collection must lie between the two `Date` objects' value.
     *
     * If one of the two objects is equal to `null`, that end is not bounded.
     *
     * Default to `null` (no filter).
     */
    public creationDate: Date[] = null;
    /**
     * If not `null`, filter for collections with the specified `isPublic`
     * value.
     *
     * Default to `null` (no filter).
     */
    public isPublic: boolean = null;
    /**
     * Sort orders within the search result.
     *
     * Default to `[{field: "creationDate", ascending: false}]`.
     */
    public sortFields: { field: string; ascending: boolean }[] = [
        { field: "creationDate", ascending: false },
    ];
}

/**
 * Basic information needed to add or update a Collection.
 */
export class CollectionBase {
    constructor(
        public collectionId: string,
        public ownerUsername: string,
        public displayName: string,
        public creationDate: Date,
        public description: string,
        public isPublic: boolean
    ) {}
}
