import "server-only";
import { db } from "@/lib/db/client";
import { sendEmail } from "@/lib/email";
import type { NotificationType } from "./types";
import type { Prisma } from "@prisma/client";

type NotifyInput = {
  userId: string;
  type: NotificationType;
  title: string;
  body?: string;
  metadata?: Prisma.InputJsonValue;
  /** If provided, also sends this email — subject to the user's notification_preferences.emailEnabled. */
  email?: { subject: string; html: string };
};

/**
 * Creates an in-app notification and, if the user has email
 * notifications enabled (default: on) and an email payload was
 * supplied, sends it too. This is the single entry point every
 * feature should call rather than writing to the notifications table
 * directly — keeps the "do not send unnecessary emails" rule in one
 * place instead of scattered across call sites.
 */
export async function notify({ userId, type, title, body, metadata, email }: NotifyInput) {
  await db.notification.create({
    data: { userId, type, title, body: body ?? null, metadata },
  });

  if (email) {
    const prefs = await db.notificationPreference.findUnique({ where: { userId } });
    const emailEnabled = prefs ? prefs.emailEnabled : true; // default on until a user sets a preference
    if (emailEnabled) {
      const user = await db.user.findUnique({ where: { id: userId } });
      if (user) {
        await sendEmail({ to: user.email, subject: email.subject, html: email.html });
      }
    }
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
