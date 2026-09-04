import bcrypt from "bcryptjs";

const SALT_ROUNDS = 12;

export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, SALT_ROUNDS);
}

export async function verifyPassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}

/**
 * Minimum password policy enforced both client- and server-side. Kept
 * here (not duplicated) so both sides always agree.
 */
export function isPasswordStrongEnough(password: string): boolean {
  return password.length >= 10;
}
