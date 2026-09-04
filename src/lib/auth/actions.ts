"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "@/lib/db/client";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import { generateSecureToken, hashToken } from "@/lib/auth/tokens";
import {
  createSession,
  destroySession,
  getCurrentSession,
} from "@/lib/auth/session";
import {
  registerSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} from "@/lib/auth/validation";
import { rateLimit } from "@/lib/rate-limit";
import { recordAudit } from "@/lib/audit";
import {
  sendEmail,
  verificationEmailHtml,
  passwordResetEmailHtml,
} from "@/lib/email";
import { getSiteUrl } from "@/lib/env";

const EMAIL_VERIFICATION_TTL_MS = 1000 * 60 * 60 * 24; // 24h
const PASSWORD_RESET_TTL_MS = 1000 * 60 * 60; // 1h

async function clientIp(): Promise<string> {
  const h = await headers();
  return (
    h.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    h.get("x-real-ip") ??
    "unknown"
  );
}

export type ActionResult<T = undefined> =
  | { ok: true; data?: T }
  | { ok: false; error: string };

async function sendVerificationEmail(
  email: string,
  token: string,
): Promise<ActionResult> {
  const delivery = await sendEmail({
    to: email,
    subject: "Verify your ACOB account",
    html: verificationEmailHtml(`${getSiteUrl()}/verify-email?token=${token}`),
  });
  if (!delivery.delivered) {
    return {
      ok: false,
      error:
        "We couldn't send the verification email. Please try again shortly.",
    };
  }
  return { ok: true };
}

async function issueVerificationToken(
  userId: string,
): Promise<{ token: string }> {
  const { token, tokenHash } = generateSecureToken();
  await db.$transaction([
    db.emailVerificationToken.updateMany({
      where: { userId, usedAt: null },
      data: { usedAt: new Date() },
    }),
    db.emailVerificationToken.create({
      data: {
        userId,
        tokenHash,
        expiresAt: new Date(Date.now() + EMAIL_VERIFICATION_TTL_MS),
      },
    }),
  ]);
  return { token };
}

/** Registration creates the user, their profile, role, and verification token atomically. */
export async function registerAction(input: unknown): Promise<ActionResult> {
  const parsed = registerSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Invalid input.",
    };
  }

  const ip = await clientIp();
  const rl = rateLimit(`register:${ip}`, {
    limit: 5,
    windowMs: 60 * 60 * 1000,
  });
  if (!rl.allowed) {
    return { ok: false, error: "Too many attempts. Try again later." };
  }

  const { fullName, email, password } = parsed.data;

  const participantRole = await db.role.findUnique({
    where: { key: "PARTICIPANT" },
  });
  if (!participantRole) {
    console.error(
      "[auth] Registration unavailable: PARTICIPANT role has not been seeded.",
    );
    return {
      ok: false,
      error: "Registration is temporarily unavailable. Please try again later.",
    };
  }

  const existing = await db.user.findUnique({
    where: { email },
    include: { userRoles: { include: { role: true } } },
  });
  if (existing) {
    if (
      existing.userRoles.some(
        (assignment) => assignment.role.key === "PARTICIPANT",
      )
    ) {
      await db.participant.upsert({
        where: { userId: existing.id },
        create: { userId: existing.id },
        update: {},
      });
    }
    // Preserve anti-enumeration. An unverified account receives a fresh link;
    // a verified one gets the same generic confirmation without a mail send.
    if (!existing.emailVerifiedAt && existing.status === "active") {
      const { token } = await issueVerificationToken(existing.id);
      const delivery = await sendVerificationEmail(existing.email, token);
      if (!delivery.ok) return delivery;
    }
    return { ok: true };
  }

  const passwordHash = await hashPassword(password);
  const { token, tokenHash } = generateSecureToken();
  let userId: string;
  try {
    const user = await db.$transaction(async (tx) => {
      const created = await tx.user.create({
        data: { email, passwordHash, profile: { create: { fullName } } },
      });
      await tx.userRole.create({
        data: {
          userId: created.id,
          roleId: participantRole.id,
          assignedBy: null,
        },
      });
      await tx.participant.create({ data: { userId: created.id } });
      await tx.emailVerificationToken.create({
        data: {
          userId: created.id,
          tokenHash,
          expiresAt: new Date(Date.now() + EMAIL_VERIFICATION_TTL_MS),
        },
      });
      return created;
    });
    userId = user.id;
  } catch (error) {
    // A concurrent registration can win after the initial lookup. Keep the
    // response generic and never expose database details to the browser.
    console.error("[auth] Registration database operation failed.", {
      message: error instanceof Error ? error.message : "unknown",
    });
    return {
      ok: false,
      error: "We couldn't create the account. Please try again.",
    };
  }

  const delivery = await sendVerificationEmail(email, token);
  if (!delivery.ok) return delivery;

  await recordAudit({
    actorId: userId,
    action: "auth:register",
    targetType: "user",
    targetId: userId,
  });

  return { ok: true };
}

export async function loginAction(input: unknown): Promise<ActionResult> {
  const parsed = loginSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Invalid input.",
    };
  }

  const ip = await clientIp();
  const rl = rateLimit(`login:${ip}`, { limit: 10, windowMs: 15 * 60 * 1000 });
  if (!rl.allowed) {
    return { ok: false, error: "Too many attempts. Try again later." };
  }

  const { email, password } = parsed.data;
  const user = await db.user.findUnique({ where: { email } });

  if (!user) {
    await recordAudit({
      actorId: null,
      action: "auth:login_failed",
      metadata: { reason: "no_such_user" },
    });
    return { ok: false, error: "Incorrect email or password." };
  }

  const validPassword = await verifyPassword(password, user.passwordHash);
  if (!validPassword) {
    await recordAudit({
      actorId: user.id,
      action: "auth:login_failed",
      metadata: { reason: "bad_password" },
    });
    return { ok: false, error: "Incorrect email or password." };
  }

  if (user.status !== "active") {
    return { ok: false, error: "This account is not active." };
  }

  await createSession(user.id);
  await recordAudit({
    actorId: user.id,
    action: "auth:login",
    targetType: "user",
    targetId: user.id,
  });

  return { ok: true };
}

export async function logoutAction(): Promise<void> {
  const session = await getCurrentSession();
  if (session) {
    await recordAudit({
      actorId: session.id,
      action: "auth:logout",
      targetType: "user",
      targetId: session.id,
    });
  }
  await destroySession();
  redirect("/login");
}

export async function verifyEmailAction(token: string): Promise<ActionResult> {
  if (!token) return { ok: false, error: "Missing verification token." };

  const tokenHash = hashToken(token);
  const record = await db.emailVerificationToken.findUnique({
    where: { tokenHash },
  });
  if (!record)
    return {
      ok: false,
      error: "This verification link is invalid or has expired.",
    };

  const now = new Date();
  const consumed = await db.$transaction(async (tx) => {
    const result = await tx.emailVerificationToken.updateMany({
      where: { id: record.id, usedAt: null, expiresAt: { gt: now } },
      data: { usedAt: now },
    });
    if (result.count !== 1) return false;
    await tx.user.update({
      where: { id: record.userId },
      data: { emailVerifiedAt: now },
    });
    const participantRole = await tx.role.findUnique({
      where: { key: "PARTICIPANT" },
    });
    if (participantRole) {
      const participantRoleAssignment = await tx.userRole.findUnique({
        where: {
          userId_roleId: { userId: record.userId, roleId: participantRole.id },
        },
      });
      if (participantRoleAssignment) {
        await tx.participant.upsert({
          where: { userId: record.userId },
          create: { userId: record.userId },
          update: {},
        });
      }
    }
    return true;
  });
  if (!consumed)
    return {
      ok: false,
      error: "This verification link is invalid or has expired.",
    };

  await recordAudit({
    actorId: record.userId,
    action: "auth:email_verified",
    targetType: "user",
    targetId: record.userId,
  });

  return { ok: true };
}

/** Always returns ok:true — never reveals whether the email exists. */
export async function forgotPasswordAction(
  input: unknown,
): Promise<ActionResult> {
  const parsed = forgotPasswordSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Invalid input.",
    };
  }

  const ip = await clientIp();
  const rl = rateLimit(`forgot-password:${ip}`, {
    limit: 5,
    windowMs: 60 * 60 * 1000,
  });
  if (!rl.allowed) {
    // Still generic, to avoid leaking timing/rate-limit signals about the email's existence.
    return { ok: true };
  }

  const { email } = parsed.data;
  const user = await db.user.findUnique({ where: { email } });

  if (user) {
    const { token, tokenHash } = generateSecureToken();
    await db.$transaction([
      db.passwordResetToken.updateMany({
        where: { userId: user.id, usedAt: null },
        data: { usedAt: new Date() },
      }),
      db.passwordResetToken.create({
        data: {
          userId: user.id,
          tokenHash,
          expiresAt: new Date(Date.now() + PASSWORD_RESET_TTL_MS),
        },
      }),
    ]);

    const delivery = await sendEmail({
      to: email,
      subject: "Reset your ACOB password",
      html: passwordResetEmailHtml(
        `${getSiteUrl()}/reset-password?token=${token}`,
      ),
    });
    if (!delivery.delivered)
      console.error("[auth] Password reset email could not be delivered.", {
        userId: user.id,
      });

    await recordAudit({
      actorId: user.id,
      action: "auth:password_reset_requested",
      targetType: "user",
      targetId: user.id,
    });
  }

  return { ok: true };
}

export async function resetPasswordAction(
  input: unknown,
): Promise<ActionResult> {
  const parsed = resetPasswordSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Invalid input.",
    };
  }

  const { token, password } = parsed.data;
  const tokenHash = hashToken(token);

  const record = await db.passwordResetToken.findUnique({
    where: { tokenHash },
  });

  if (!record)
    return { ok: false, error: "This reset link is invalid or has expired." };

  const passwordHash = await hashPassword(password);
  const now = new Date();
  const consumed = await db.$transaction(async (tx) => {
    const result = await tx.passwordResetToken.updateMany({
      where: { id: record.id, usedAt: null, expiresAt: { gt: now } },
      data: { usedAt: now },
    });
    if (result.count !== 1) return false;
    await tx.user.update({
      where: { id: record.userId },
      data: { passwordHash },
    });
    await tx.session.deleteMany({ where: { userId: record.userId } });
    return true;
  });
  if (!consumed)
    return { ok: false, error: "This reset link is invalid or has expired." };

  await recordAudit({
    actorId: record.userId,
    action: "auth:password_reset",
    targetType: "user",
    targetId: record.userId,
  });

  return { ok: true };
}

export async function resendVerificationAction(): Promise<ActionResult> {
  const session = await getCurrentSession();
  if (!session) return { ok: false, error: "Not signed in." };
  if (session.emailVerified) return { ok: true };

  const rl = rateLimit(`resend-verification:${session.id}`, {
    limit: 3,
    windowMs: 60 * 60 * 1000,
  });
  if (!rl.allowed) {
    return { ok: false, error: "Too many attempts. Try again later." };
  }

  const { token } = await issueVerificationToken(session.id);
  return sendVerificationEmail(session.email, token);
}
