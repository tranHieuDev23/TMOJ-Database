import { StatusCodes } from "http-status-codes";
import { Error } from "mongoose";
import { TmojDatabaseNotFoundError } from "../models/daos/exceptions";

// Error handler
export function errorHandler(err, req, res, next) {
    if (err instanceof TmojDatabaseNotFoundError) {
        return res.status(StatusCodes.NOT_FOUND).json({
            error: err.message,
        });
    }
    if (err instanceof Error.ValidationError) {
        return res.status(StatusCodes.BAD_REQUEST).json({
            error: err.message,
        });
    }
    console.error(err);
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        error: "Internal server error",
    });
}
