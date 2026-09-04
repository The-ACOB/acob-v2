"use server";

import { revalidatePath } from "next/cache";
import { requirePermission, AuthError } from "@/lib/authz/guards";
import { db } from "@/lib/db/client";
import { recordAudit } from "@/lib/audit";
import { notify } from "@/lib/notifications";
import { approvalDecidedEmail } from "@/lib/email/templates";
import { executeApprovedRequest } from "./effects";
import type { ActionResult } from "@/lib/auth/actions";

/**
 * Approve a pending request. The requester can never approve their own
 * request — enforced server-side here, not just left off the UI.
 */
export async function approveRequestAction(requestId: string, reason?: string): Promise<ActionResult> {
  let actor;
  try {
    actor = await requirePermission("approval:approve");
  } catch (err) {
    if (err instanceof AuthError) return { ok: false, error: err.message };
    throw err;
  }

  const request = await db.approvalRequest.findUnique({ where: { id: requestId } });
  if (!request) return { ok: false, error: "Approval request not found." };
  if (request.status !== "pending") return { ok: false, error: "This request has already been decided." };
  if (request.requestedBy === actor.id) {
    return { ok: false, error: "You cannot approve your own request." };
  }

  await db.approvalRequest.update({
    where: { id: requestId },
    data: { status: "approved", reviewedBy: actor.id, reviewedAt: new Date(), reason: reason ?? null },
  });

  await executeApprovedRequest(request, actor.id);

  await recordAudit({
    actorId: actor.id,
    action: "approval:approved",
    targetType: "approval_request",
    targetId: requestId,
  });

  await notify({
    userId: request.requestedBy,
    type: "approval:completed",
    title: "Your request was approved",
    body: request.type.replace(/_/g, " "),
    metadata: { requestId },
    email: approvalDecidedEmail({ type: request.type, status: "approved" }),
  });

  revalidatePath("/dashboard/approvals");
  return { ok: true };
}

export async function rejectRequestAction(requestId: string, reason?: string): Promise<ActionResult> {
  let actor;
  try {
    actor = await requirePermission("approval:reject");
  } catch (err) {
    if (err instanceof AuthError) return { ok: false, error: err.message };
    throw err;
  }

  const request = await db.approvalRequest.findUnique({ where: { id: requestId } });
  if (!request) return { ok: false, error: "Approval request not found." };
  if (request.status !== "pending") return { ok: false, error: "This request has already been decided." };
  if (request.requestedBy === actor.id) {
    return { ok: false, error: "You cannot reject your own request." };
  }

  await db.approvalRequest.update({
    where: { id: requestId },
    data: { status: "rejected", reviewedBy: actor.id, reviewedAt: new Date(), reason: reason ?? null },
  });

  await recordAudit({
    actorId: actor.id,
    action: "approval:rejected",
    targetType: "approval_request",
    targetId: requestId,
  });

  await notify({
    userId: request.requestedBy,
    type: "approval:completed",
    title: "Your request was rejected",
    body: request.type.replace(/_/g, " "),
    metadata: { requestId },
    email: approvalDecidedEmail({ type: request.type, status: "rejected" }),
  });

  revalidatePath("/dashboard/approvals");
  return { ok: true };
}
