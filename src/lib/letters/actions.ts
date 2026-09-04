"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db/client";
import { requirePermission, AuthError } from "@/lib/authz/guards";
import { recordAudit } from "@/lib/audit";
import { notify } from "@/lib/notifications";
import { createLetterSchema } from "./validation";
import type { ActionResult } from "@/lib/auth/actions";

/**
 * Creates a letter in "draft" status — invisible to the participant
 * until explicitly published. There is deliberately no update/edit
 * action: a letter is created, published, or revoked, never edited
 * in place, and participants have no write path to it at all.
 */
export async function createLetterAction(
  input: unknown,
): Promise<ActionResult<{ id: string }>> {
  let actor;
  try {
    actor = await requirePermission("recommendation_letter:create");
  } catch (err) {
    if (err instanceof AuthError) return { ok: false, error: err.message };
    throw err;
  }

  const parsed = createLetterSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Invalid input.",
    };
  }
  const v = parsed.data;

  const recipient = v.recipientUserId
    ? await db.user.findFirst({
        where: { id: v.recipientUserId, participant: { isNot: null } },
      })
    : await db.user.findUnique({ where: { email: v.recipientEmail } });
  if (!recipient)
    return { ok: false, error: "No account found with that email." };

  const letter = await db.recommendationLetter.create({
    data: {
      userId: recipient.id,
      title: v.title,
      body: v.body || null,
      fileUrl: v.fileUrl || null,
      issuedBy: actor.id,
    },
  });

  await recordAudit({
    actorId: actor.id,
    action: "recommendation_letter:created",
    targetType: "recommendation_letter",
    targetId: letter.id,
    metadata: { userId: recipient.id },
  });

  revalidatePath("/dashboard/recommendation-letters");
  return { ok: true, data: { id: letter.id } };
}

export async function publishLetterAction(id: string): Promise<ActionResult> {
  let actor;
  try {
    actor = await requirePermission("recommendation_letter:publish");
  } catch (err) {
    if (err instanceof AuthError) return { ok: false, error: err.message };
    throw err;
  }

  const letter = await db.recommendationLetter.findUnique({ where: { id } });
  if (!letter) return { ok: false, error: "Letter not found." };
  if (letter.status === "published")
    return { ok: false, error: "Already published." };

  await db.recommendationLetter.update({
    where: { id },
    data: { status: "published", publishedAt: new Date() },
  });

  await recordAudit({
    actorId: actor.id,
    action: "recommendation_letter:published",
    targetType: "recommendation_letter",
    targetId: id,
  });

  await notify({
    userId: letter.userId,
    type: "recommendation_letter:available",
    title: "A recommendation letter is available",
    body: letter.title,
    metadata: { letterId: id },
  });

  revalidatePath("/dashboard/recommendation-letters");
  return { ok: true };
}

export async function revokeLetterAction(id: string): Promise<ActionResult> {
  let actor;
  try {
    actor = await requirePermission("recommendation_letter:revoke");
  } catch (err) {
    if (err instanceof AuthError) return { ok: false, error: err.message };
    throw err;
  }

  const letter = await db.recommendationLetter.findUnique({ where: { id } });
  if (!letter) return { ok: false, error: "Letter not found." };

  await db.recommendationLetter.update({
    where: { id },
    data: { status: "revoked", revokedBy: actor.id, revokedAt: new Date() },
  });

  await recordAudit({
    actorId: actor.id,
    action: "recommendation_letter:revoked",
    targetType: "recommendation_letter",
    targetId: id,
  });

  revalidatePath("/dashboard/recommendation-letters");
  return { ok: true };
}
