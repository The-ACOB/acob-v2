import "server-only";
import { randomBytes } from "crypto";
import { db } from "@/lib/db/client";
import { hashPassword } from "./password";
import { generateSecureToken } from "./tokens";
import { sendEmail } from "@/lib/email";
import { getSiteUrl } from "@/lib/env";

function inviteEmailHtml(fullName: string, link: string): string {
  return `<p>Hi ${fullName},</p><p>An ACOB account has been created for you. Set your password to get started:</p><p><a href="${link}">${link}</a></p><p>This link expires in 24 hours.</p>`;
}

/**
 * Creates a new user with an unusable password (a random hash the
 * person could never derive or type) and immediately emails them a
 * password-set link — the same token mechanism as password reset,
 * reused here as an account invite rather than inventing a parallel
 * "temporary password" flow.
 */
export async function createInvitedUser(params: { email: string; fullName: string; roleKey: string }): Promise<
  { ok: true; userId: string } | { ok: false; error: string }
> {
  const existing = await db.user.findUnique({ where: { email: params.email } });
  if (existing) return { ok: false, error: "An account with that email already exists." };

  const unusablePasswordHash = await hashPassword(randomBytes(32).toString("hex"));
  const user = await db.user.create({
    data: {
      email: params.email,
      passwordHash: unusablePasswordHash,
      profile: { create: { fullName: params.fullName } },
    },
  });

  const role = await db.role.findUnique({ where: { key: params.roleKey } });
  if (role) {
    await db.userRole.create({ data: { userId: user.id, roleId: role.id, assignedBy: null } });
  }

  const { token, tokenHash } = generateSecureToken();
  await db.passwordResetToken.create({
    data: { userId: user.id, tokenHash, expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24) },
  });

  const delivery = await sendEmail({
    to: params.email,
    subject: "You've been added to ACOB",
    html: inviteEmailHtml(params.fullName, `${getSiteUrl()}/reset-password?token=${token}`),
  });
  if (!delivery.delivered) {
    console.error("[auth] Invite email could not be delivered.", { userId: user.id });
    return { ok: false, error: "The account was created, but the invitation email could not be sent. Retry the password reset from the participant profile." };
  }

  return { ok: true, userId: user.id };
}
