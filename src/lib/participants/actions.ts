"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db/client";
import { requirePermission, AuthError } from "@/lib/authz/guards";
import { createInvitedUser } from "@/lib/auth/invite";
import { generateSecureToken } from "@/lib/auth/tokens";
import { sendEmail, passwordResetEmailHtml } from "@/lib/email";
import { getSiteUrl } from "@/lib/env";
import { recordAudit } from "@/lib/audit";
import { notify } from "@/lib/notifications";
import { getUsersWithPermission } from "@/lib/authz/resolve-users";
import { registerParticipantSchema } from "./validation";
import type { ActionResult } from "@/lib/auth/actions";

/** HR/PR registers a new participant account directly. */
export async function hrRegisterParticipantAction(input: unknown): Promise<ActionResult> {
  let actor;
  try {
    actor = await requirePermission("participant:create");
  } catch (err) {
    if (err instanceof AuthError) return { ok: false, error: err.message };
    throw err;
  }

  const parsed = registerParticipantSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }
  const v = parsed.data;

  const invited = await createInvitedUser({ email: v.email, fullName: v.fullName, roleKey: "PARTICIPANT" });
  if (!invited.ok) return invited;

  await db.participant.create({
    data: { userId: invited.userId, institution: v.institution || null, gradeLevel: v.gradeLevel || null },
  });

  await recordAudit({
    actorId: actor.id,
    action: "participant:registered",
    targetType: "user",
    targetId: invited.userId,
    metadata: { by: "hr_pr" },
  });

  revalidatePath("/dashboard/participants");
  return { ok: true };
}

/**
 * HR/PR *requests* an ambassador promotion — it does not grant the
 * role. The request sits pending until an executive (CEO/COO/CTO)
 * approves it via /dashboard/approvals; only then does the role
 * actually get assigned (see lib/approvals/effects.ts). This is the
 * "cannot bypass executive approval" boundary, enforced structurally.
 */
export async function requestAmbassadorPromotionAction(userId: string): Promise<ActionResult> {
  let actor;
  try {
    actor = await requirePermission("participant:update");
  } catch (err) {
    if (err instanceof AuthError) return { ok: false, error: err.message };
    throw err;
  }

  const user = await db.user.findUnique({ where: { id: userId } });
  if (!user) return { ok: false, error: "User not found." };

  const request = await db.approvalRequest.create({
    data: {
      type: "ambassador_promotion",
      targetType: "user",
      targetId: userId,
      requestedBy: actor.id,
      reason: "Requested by HR/PR",
    },
  });

  await recordAudit({
    actorId: actor.id,
    action: "approval:requested",
    targetType: "approval_request",
    targetId: request.id,
    metadata: { type: "ambassador_promotion", targetUserId: userId },
  });

  const approvers = await getUsersWithPermission("approval:approve");
  await Promise.all(
    approvers.map((a) =>
      notify({
        userId: a.userId,
        type: "approval:requested",
        title: "Ambassador promotion requested",
        body: "A promotion request is awaiting your review.",
        metadata: { requestId: request.id },
      })
    )
  );

  revalidatePath("/dashboard/participants");
  return { ok: true };
}

/** HR/PR triggers a password reset email on a participant's behalf — never reveals or sets the password itself. */
export async function staffTriggerPasswordResetAction(userId: string): Promise<ActionResult> {
  let actor;
  try {
    actor = await requirePermission("user:update");
  } catch (err) {
    if (err instanceof AuthError) return { ok: false, error: err.message };
    throw err;
  }

  const user = await db.user.findUnique({ where: { id: userId } });
  if (!user) return { ok: false, error: "User not found." };

  const { token, tokenHash } = generateSecureToken();
  await db.passwordResetToken.create({
    data: { userId: user.id, tokenHash, expiresAt: new Date(Date.now() + 1000 * 60 * 60) },
  });

  const siteUrl = getSiteUrl();
  const delivery = await sendEmail({
    to: user.email,
    subject: "Reset your ACOB password",
    html: passwordResetEmailHtml(`${siteUrl}/reset-password?token=${token}`),
  });
  if (!delivery.delivered) {
    console.error("[auth] Staff-triggered password reset email could not be delivered.", { userId: user.id });
    return { ok: false, error: "The password reset email could not be sent. Please try again shortly." };
  }

  await recordAudit({
    actorId: actor.id,
    action: "auth:password_reset_requested",
    targetType: "user",
    targetId: userId,
    metadata: { by: "staff" },
  });

  return { ok: true };
}

/**
 * An ambassador registering a new participant. Unlike HR/PR's version,
 * this also creates the ambassador_referrals link — the record that
 * "an ambassador can only see participants they personally registered"
 * is checked against everywhere else in the app.
 */
export async function ambassadorRegisterParticipantAction(input: unknown): Promise<ActionResult> {
  let actor;
  try {
    actor = await requirePermission("participant:create");
  } catch (err) {
    if (err instanceof AuthError) return { ok: false, error: err.message };
    throw err;
  }

  const ambassador = await db.ambassador.findUnique({ where: { userId: actor.id } });
  if (!ambassador) return { ok: false, error: "Your ambassador profile isn't set up yet." };

  const parsed = registerParticipantSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }
  const v = parsed.data;

  const invited = await createInvitedUser({ email: v.email, fullName: v.fullName, roleKey: "PARTICIPANT" });
  if (!invited.ok) return invited;

  const participant = await db.participant.create({
    data: { userId: invited.userId, institution: v.institution || null, gradeLevel: v.gradeLevel || null },
  });

  await db.ambassadorReferral.create({
    data: { ambassadorId: ambassador.id, participantId: participant.id },
  });

  await recordAudit({
    actorId: actor.id,
    action: "participant:registered",
    targetType: "user",
    targetId: invited.userId,
    metadata: { by: "ambassador" },
  });

  revalidatePath("/dashboard/referrals");
  return { ok: true };
}
