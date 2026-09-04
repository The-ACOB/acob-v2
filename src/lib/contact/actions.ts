"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db/client";
import { getCurrentSession } from "@/lib/auth/session";
import { requirePermission, AuthError } from "@/lib/authz/guards";
import { contactSubmitSchema } from "./validation";
import { rateLimit } from "@/lib/rate-limit";
import { notify } from "@/lib/notifications";
import { getUsersWithPermission } from "@/lib/authz/resolve-users";
import { recordAudit } from "@/lib/audit";
import { sendEmail } from "@/lib/email";
import { contactResponseEmail } from "@/lib/email/templates";
import type { ActionResult } from "@/lib/auth/actions";

async function clientIp(): Promise<string> {
  const h = await headers();
  return h.get("x-forwarded-for")?.split(",")[0]?.trim() ?? h.get("x-real-ip") ?? "unknown";
}

/**
 * Public contact form submission. No authentication required, but if
 * the submitter happens to be signed in, their account is linked so
 * staff can see submission history and so any reply also reaches them
 * in-app, not just by email.
 */
export async function submitContactAction(input: unknown): Promise<ActionResult> {
  const parsed = contactSubmitSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  const ip = await clientIp();
  const rl = rateLimit(`contact:${ip}`, { limit: 5, windowMs: 60 * 60 * 1000 });
  if (!rl.allowed) {
    return { ok: false, error: "Too many messages sent. Please try again later." };
  }

  const session = await getCurrentSession();
  const { name, email, subject, category, message } = parsed.data;

  const submission = await db.contactSubmission.create({
    data: { name, email, subject, category, message, userId: session?.id ?? null },
  });

  const staff = await getUsersWithPermission("contact:view");
  await Promise.all(
    staff.map((s) =>
      notify({
        userId: s.userId,
        type: "contact:new",
        title: "New contact message",
        body: `${name}: ${subject}`,
        metadata: { submissionId: submission.id },
      })
    )
  );

  return { ok: true };
}

/**
 * Staff reply to a contact submission. The recipient sees this as
 * coming from "ACOB Support Team" — see email/templates.ts — never
 * the individual staff member's identity.
 */
export async function replyToContactAction(submissionId: string, body: string): Promise<ActionResult> {
  let actor;
  try {
    actor = await requirePermission("contact:reply");
  } catch (err) {
    if (err instanceof AuthError) return { ok: false, error: err.message };
    throw err;
  }
  if (!body || body.trim().length < 2) {
    return { ok: false, error: "Reply cannot be empty." };
  }

  const submission = await db.contactSubmission.findUnique({ where: { id: submissionId } });
  if (!submission) return { ok: false, error: "Submission not found." };

  await db.contactReply.create({ data: { submissionId, staffUserId: actor.id, body } });

  if (submission.userId) {
    await notify({
      userId: submission.userId,
      type: "contact:response",
      title: "ACOB Support replied to your message",
      body: submission.subject,
      metadata: { submissionId },
    });
  }

  await sendEmail({
    to: submission.email,
    ...contactResponseEmail({ name: submission.name, subject: submission.subject, replyBody: body }),
  });

  await recordAudit({
    actorId: actor.id,
    action: "contact:replied",
    targetType: "contact_submission",
    targetId: submissionId,
  });

  revalidatePath(`/dashboard/contact/${submissionId}`);
  return { ok: true };
}

export async function setContactStatusAction(
  submissionId: string,
  status: "open" | "resolved"
): Promise<ActionResult> {
  let actor;
  try {
    actor = await requirePermission("contact:reply");
  } catch (err) {
    if (err instanceof AuthError) return { ok: false, error: err.message };
    throw err;
  }

  await db.contactSubmission.update({ where: { id: submissionId }, data: { status } });

  await recordAudit({
    actorId: actor.id,
    action: status === "resolved" ? "contact:resolved" : "contact:reopened",
    targetType: "contact_submission",
    targetId: submissionId,
  });

  revalidatePath(`/dashboard/contact/${submissionId}`);
  revalidatePath("/dashboard/contact");
  return { ok: true };
}
