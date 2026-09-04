import { randomBytes, createHash } from "crypto";

/**
 * Generates a URL-safe random token for email verification / password
 * reset links, plus its SHA-256 hash for storage. Only the hash is
 * ever persisted — the raw token exists only in the emailed link and
 * in memory for the duration of the request that issued it.
 */
export function generateSecureToken(): { token: string; tokenHash: string } {
  const token = randomBytes(32).toString("base64url");
  const tokenHash = hashToken(token);
  return { token, tokenHash };
}

export function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}
