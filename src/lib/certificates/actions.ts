"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db/client";
import { requirePermission, AuthError } from "@/lib/authz/guards";
import { recordAudit } from "@/lib/audit";
import { notify } from "@/lib/notifications";
import { rateLimit } from "@/lib/rate-limit";
import { generateCertificateId, generateVerificationToken } from "./ids";
import { issueCertificateSchema, verifyCertificateSchema } from "./validation";
import type { ActionResult } from "@/lib/auth/actions";

function achievementForRank(rank: number): "prime" | "elite" | "merit" | "honourable_mention" | "participation" {
  if (rank === 1) return "prime";
  if (rank === 2) return "elite";
  if (rank === 3) return "merit";
  if (rank <= 10) return "honourable_mention";
  return "participation";
}

async function clientIp(): Promise<string> {
  const h = await headers();
  return (
    h.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    h.get("x-real-ip") ??
    "unknown"
  );
}

export async function issueCertificateAction(
  input: unknown,
): Promise<ActionResult<{ certificateId: string }>> {
  let actor;
  try {
    actor = await requirePermission("certificate:issue");
  } catch (err) {
    if (err instanceof AuthError) return { ok: false, error: err.message };
    throw err;
  }

  const parsed = issueCertificateSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Invalid input.",
    };
  }

  const v = parsed.data;

  const recipient = await db.user.findUnique({
    where: { email: v.recipientEmail },
  });

  if (!recipient) {
    return { ok: false, error: "No account found with that email." };
  }

  const olympiad = await db.olympiad.findUnique({
    where: { id: v.olympiadId },
  });

  if (!olympiad) {
    return { ok: false, error: "Olympiad not found." };
  }

  const duplicate = await db.certificate.findFirst({
    where: { userId: recipient.id, olympiadId: olympiad.id, status: "valid" },
    select: { certificateId: true },
  });
  if (duplicate) {
    return { ok: false, error: "A valid certificate has already been issued for this recipient and Olympiad." };
  }

  if (v.attemptId) {
    const attempt = await db.attempt.findUnique({ where: { id: v.attemptId } });
    if (!attempt || attempt.userId !== recipient.id || attempt.olympiadId !== olympiad.id || !attempt.rank) {
      return { ok: false, error: "The selected attempt does not have published results for this recipient and Olympiad." };
    }
    const expectedAchievement = achievementForRank(attempt.rank);
    if (v.achievement !== expectedAchievement) {
      return { ok: false, error: `This participant's published rank requires a ${expectedAchievement.replace(/_/g, " ")} certificate.` };
    }
  }

  const certificateId = await generateCertificateId();
  const verificationToken = generateVerificationToken();

  await db.certificate.create({
    data: {
      certificateId,
      verificationToken,
      userId: recipient.id,
      olympiadId: v.olympiadId,
      attemptId: v.attemptId || null,
      achievement: v.achievement,
      fileUrl: v.fileUrl || null,
      issuedBy: actor.id,
    },
  });

  await recordAudit({
    actorId: actor.id,
    action: "certificate:issued",
    targetType: "certificate",
    targetId: certificateId,
    metadata: {
      userId: recipient.id,
      olympiadId: v.olympiadId,
      achievement: v.achievement,
    },
  });

  await notify({
    userId: recipient.id,
    type: "certificate:available",
    title: "Your certificate is ready",
    body: olympiad.title,
    metadata: { certificateId },
  });

  revalidatePath("/dashboard/certificates");

  return { ok: true, data: { certificateId } };
}

export async function revokeCertificateAction(
  id: string,
): Promise<ActionResult> {
  let actor;
  try {
    actor = await requirePermission("certificate:revoke");
  } catch (err) {
    if (err instanceof AuthError) return { ok: false, error: err.message };
    throw err;
  }

  const cert = await db.certificate.findUnique({
    where: { id },
  });

  if (!cert) {
    return { ok: false, error: "Certificate not found." };
  }

  if (cert.status === "revoked") {
    return { ok: false, error: "Already revoked." };
  }

  await db.certificate.update({
    where: { id },
    data: {
      status: "revoked",
      revokedBy: actor.id,
      revokedAt: new Date(),
    },
  });

  await recordAudit({
    actorId: actor.id,
    action: "certificate:revoked",
    targetType: "certificate",
    targetId: cert.certificateId,
  });

  revalidatePath("/dashboard/certificates");

  return { ok: true };
}

export type VerifyResult =
  | {
      verified: true;
      holderName: string;
      olympiadTitle: string;
      achievement: string;
      issuedAt: string;
      certificateId: string;
    }
  | { verified: false };

/**
 * Public, unauthenticated verification. Deliberately returns the same
 * generic "not verified" shape whether the ID doesn't exist, is
 * malformed, or belongs to a revoked certificate — never distinguishing
 * those cases, so probing this endpoint can't be used to enumerate
 * which certificate IDs are real.
 */
export async function verifyCertificateAction(
  input: unknown,
): Promise<VerifyResult> {
  const ip = await clientIp();

  const rl = rateLimit(`verify-cert:${ip}`, {
    limit: 20,
    windowMs: 60 * 60 * 1000,
  });

  if (!rl.allowed) return { verified: false };

  const parsed = verifyCertificateSchema.safeParse(input);
  if (!parsed.success) return { verified: false };

  const cert = parsed.data.token
    ? await db.certificate.findUnique({
        where: { verificationToken: parsed.data.token },
        include: {
          recipient: {
            include: {
              profile: true,
            },
          },
          olympiad: true,
        },
      })
    : await db.certificate.findUnique({
        where: { certificateId: parsed.data.certificateId },
        include: {
          recipient: {
            include: {
              profile: true,
            },
          },
          olympiad: true,
        },
      });

  if (!cert || cert.status !== "valid") {
    return { verified: false };
  }

  return {
    verified: true,
    holderName: cert.recipient?.profile?.fullName ?? "ACOB Participant",
    olympiadTitle: cert.olympiad?.title ?? "ACOB Olympiad",
    achievement: cert.achievement,
    issuedAt: cert.issuedAt.toISOString(),
    certificateId: cert.certificateId,
  };
}
