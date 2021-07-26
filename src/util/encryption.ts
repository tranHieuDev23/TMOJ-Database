import bcrypt from "bcrypt";

const SALT_ROUND = 10;

export async function hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, SALT_ROUND);
}

export async function isPasswordEqual(password: string, encrypted: string): Promise<boolean> {
    return bcrypt.compare(password, encrypted);
}