import "server-only";
import { db } from "@/lib/db/client";
import { sendEmail, sendEmailBatch } from "@/lib/email";
import { notificationEmail } from "@/lib/email/templates";
import { getSiteUrl } from "@/lib/env";
import type { NotificationType } from "./types";
import type { Prisma } from "@prisma/client";

type EmailPayload = { subject: string; html: string };

type NotifyInput = {
  userId: string;
  type: NotificationType;
  title: string;
  body?: string;
  metadata?: Prisma.InputJsonValue;
  /**
   * Email behaviour (subject to the user's notification_preferences.emailEnabled):
   *  - omitted: a standard email mirroring the title/body is sent
   *  - { subject, html }: that custom email is sent instead
   *  - false: no email (use when the caller already emails the user itself)
   */
  email?: EmailPayload | false;
};

function dashboardLink(): string | undefined {
  try {
    return `${getSiteUrl()}/dashboard/notifications`;
  } catch {
    return undefined;
  }
}

function resolveEmail(
  email: EmailPayload | false | undefined,
  title: string,
  body: string | undefined,
): EmailPayload | null {
  if (email === false) return null;
  return email ?? notificationEmail({ title, body, link: dashboardLink() });
}

/**
 * Creates an in-app notification and, if the user has email
 * notifications enabled (default: on), also emails it through Resend.
 * This is the single entry point every feature should call rather than
 * writing to the notifications table directly — keeps the "who gets
 * emailed" rule in one place instead of scattered across call sites.
 *
 * Email delivery is best-effort: a failure never breaks the action
 * that triggered the notification.
 */
export async function notify({ userId, type, title, body, metadata, email }: NotifyInput) {
  await db.notification.create({
    data: { userId, type, title, body: body ?? null, metadata },
  });

  const payload = resolveEmail(email, title, body);
  if (!payload) return;

  try {
    const prefs = await db.notificationPreference.findUnique({ where: { userId } });
    const emailEnabled = prefs ? prefs.emailEnabled : true; // default on until a user sets a preference
    if (!emailEnabled) return;

    const user = await db.user.findUnique({ where: { id: userId } });
    if (user?.email) {
      await sendEmail({ to: user.email, subject: payload.subject, html: payload.html });
    }
  } catch (error) {
    console.error("[notify] Email step failed:", {
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
}

/**
 * Same as notify(), but for the same message going to many users at once
 * (staff fan-outs, results published to every participant). Uses a single
 * bulk insert and Resend's batch endpoint so large audiences don't hit
 * per-request rate limits.
 */
export async function notifyMany({
  userIds,
  type,
  title,
  body,
  metadata,
  email,
}: Omit<NotifyInput, "userId"> & { userIds: string[] }) {
  const ids = [...new Set(userIds)];
  if (ids.length === 0) return;

  await db.notification.createMany({
    data: ids.map((userId) => ({ userId, type, title, body: body ?? null, metadata })),
  });

  const payload = resolveEmail(email, title, body);
  if (!payload) return;

  try {
    const [prefs, users] = await Promise.all([
      db.notificationPreference.findMany({ where: { userId: { in: ids } } }),
      db.user.findMany({ where: { id: { in: ids } }, select: { id: true, email: true } }),
    ]);
    const disabled = new Set(prefs.filter((p) => !p.emailEnabled).map((p) => p.userId));

    await sendEmailBatch(
      users
        .filter((u) => u.email && !disabled.has(u.id))
        .map((u) => ({ to: u.email, subject: payload.subject, html: payload.html })),
    );
  } catch (error) {
    console.error("[notify] Bulk email step failed:", {
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
}

export async function markNotificationRead(id: string, userId: string) {
  const n = await db.notification.findUnique({ where: { id } });
  if (!n || n.userId !== userId) return { ok: false as const };
  await db.notification.update({ where: { id }, data: { readAt: new Date() } });
  return { ok: true as const };
}

export async function markAllNotificationsRead(userId: string) {
  await db.notification.updateMany({ where: { userId, readAt: null }, data: { readAt: new Date() } });
}

export async function updateNotificationPreferences(
  userId: string,
  prefs: { emailEnabled: boolean; inAppEnabled: boolean }
) {
  return db.notificationPreference.upsert({
    where: { userId },
    update: prefs,
    create: { userId, ...prefs },
  });
}
