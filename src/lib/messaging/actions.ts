"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db/client";
import { requireAuth, requirePermission, requireOwnership, AuthError } from "@/lib/authz/guards";
import { getUsersWithPermission } from "@/lib/authz/resolve-users";
import { notify } from "@/lib/notifications";
import { supportResponseEmail } from "@/lib/email/templates";
import { recordAudit } from "@/lib/audit";
import type { ActionResult } from "@/lib/auth/actions";

export async function sendMyMessageAction(body: string): Promise<ActionResult> {
  let session;
  try {
    session = await requireAuth();
  } catch (err) {
    if (err instanceof AuthError) return { ok: false, error: err.message };
    throw err;
  }
  if (!body || body.trim().length < 1) {
    return { ok: false, error: "Message cannot be empty." };
  }

  let conversation = await db.conversation.findFirst({ where: { participantUserId: session.id } });
  if (!conversation) {
    conversation = await db.conversation.create({ data: { participantUserId: session.id } });
  }

  await db.message.create({ data: { conversationId: conversation.id, senderUserId: session.id, body } });

  if (conversation.status === "resolved") {
    await db.conversation.update({ where: { id: conversation.id }, data: { status: "open" } });
  }

  const staff = await getUsersWithPermission("support:reply");
  await Promise.all(
    staff.map((s) =>
      notify({
        userId: s.userId,
        type: "support:new_message",
        title: "New message from a participant",
        body: body.slice(0, 120),
        metadata: { conversationId: conversation!.id },
      })
    )
  );

  revalidatePath("/dashboard/messages");
  return { ok: true };
}

/**
 * Staff reply to a conversation. Recorded with the real staff user id
 * for accountability, but rendered to the participant as "ACOB
 * Support Team" — see components/dashboard/ConversationThread.tsx.
 */
export async function staffReplyAction(conversationId: string, body: string): Promise<ActionResult> {
  let actor;
  try {
    actor = await requirePermission("support:reply");
  } catch (err) {
    if (err instanceof AuthError) return { ok: false, error: err.message };
    throw err;
  }
  if (!body || body.trim().length < 1) {
    return { ok: false, error: "Reply cannot be empty." };
  }

  const conversation = await db.conversation.findUnique({ where: { id: conversationId } });
  if (!conversation) return { ok: false, error: "Conversation not found." };

  await db.message.create({ data: { conversationId, senderUserId: actor.id, body } });

  await notify({
    userId: conversation.participantUserId,
    type: "support:response",
    title: "ACOB Support replied",
    body: body.slice(0, 120),
    metadata: { conversationId },
    email: supportResponseEmail({ name: "there", replyBody: body }),
  });

  await recordAudit({
    actorId: actor.id,
    action: "support:replied",
    targetType: "conversation",
    targetId: conversationId,
  });

  revalidatePath(`/dashboard/support/${conversationId}`);
  return { ok: true };
}

export async function setConversationStatusAction(
  conversationId: string,
  status: "open" | "resolved"
): Promise<ActionResult> {
  let actor;
  try {
    actor = await requirePermission("support:reply");
  } catch (err) {
    if (err instanceof AuthError) return { ok: false, error: err.message };
    throw err;
  }

  await db.conversation.update({ where: { id: conversationId }, data: { status } });

  await recordAudit({
    actorId: actor.id,
    action: status === "resolved" ? "support:resolved" : "support:reopened",
    targetType: "conversation",
    targetId: conversationId,
  });

  revalidatePath(`/dashboard/support/${conversationId}`);
  revalidatePath("/dashboard/support");
  return { ok: true };
}

/** A participant reopening their own resolved conversation. */
export async function reopenMyConversationAction(conversationId: string): Promise<ActionResult> {
  try {
    await requireOwnership({
      resolveOwnerId: async () => {
        const conv = await db.conversation.findUnique({ where: { id: conversationId } });
        return conv?.participantUserId ?? null;
      },
    });
  } catch (err) {
    if (err instanceof AuthError) return { ok: false, error: err.message };
    throw err;
  }

  await db.conversation.update({ where: { id: conversationId }, data: { status: "open" } });
  revalidatePath("/dashboard/messages");
  return { ok: true };
}
