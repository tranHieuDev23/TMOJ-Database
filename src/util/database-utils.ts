import { hashPassword } from "./encryption";
import { AuthenticationMethod } from "../models/authentication-detail";

export function trimStringSetter(value: string) {
    return value.trim();
}

export async function hashPasswordMiddleware(next: any) {
    if (
        this.method === AuthenticationMethod.Password.valueOf() &&
        this.isModified("value")
    ) {
        try {
            const hashed = await hashPassword(this.value);
            this.value = hashed;
            return next();
        } catch (error) {
            return next(error);
        }
    }
    return next();
}
