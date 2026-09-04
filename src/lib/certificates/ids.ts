import "server-only";
import { randomBytes } from "crypto";
import { db } from "@/lib/db/client";

const ID_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no 0/O/1/I — avoids human transcription errors

function randomSegment(length: number): string {
  const bytes = randomBytes(length);
  let out = "";
  for (let i = 0; i < length; i++) out += ID_ALPHABET[bytes[i] % ID_ALPHABET.length];
  return out;
}

/**
 * Human-readable, but not sequential and not guessable from a prior
 * certificate's ID — the year gives useful structure, the random
 * segment (32^6 ≈ 1 billion combinations) is what actually prevents
 * enumeration. This is what's printed on the certificate and typed
 * into the /verify form.
 */
export async function generateCertificateId(): Promise<string> {
  const year = new Date().getFullYear();
  let id: string;
  do {
    id = `ACOB-${year}-${randomSegment(6)}`;
  } while (await db.certificate.findUnique({ where: { certificateId: id } }));
  return id;
}

/**
 * A completely separate, much higher-entropy identifier used only in
 * the QR code — 256 bits of randomness, never derived from or
 * related to the certificateId above.
 */
export function generateVerificationToken(): string {
  return randomBytes(32).toString("base64url");
}
