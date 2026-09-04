import "server-only";
import { db } from "@/lib/db/client";
import { recordAudit } from "@/lib/audit";
import { notify } from "@/lib/notifications";

type ApprovalRequestRow = {
  id: string;
  type: string;
  targetType: string;
  targetId: string;
  requestedBy: string;
};

/**
 * Performs the actual effect of an approved request. This is what
 * makes the approval system real rather than cosmetic — a role like
 * HR_PR can *propose* an action (e.g. an ambassador promotion), but
 * only once an executive approves it does this function run, and it
 * always runs as the approving executive's authority, never the
 * original requester's.
 */
export async function executeApprovedRequest(request: ApprovalRequestRow, approverId: string) {
  if (request.type === "ambassador_promotion" && request.targetType === "user") {
    const ambassadorRole = await db.role.findUnique({ where: { key: "AMBASSADOR" } });
    if (!ambassadorRole) return;

    try {
      await db.userRole.create({
        data: { userId: request.targetId, roleId: ambassadorRole.id, assignedBy: approverId },
      });
    } catch {
      // Already holds the role — nothing further to do.
      return;
    }

    await recordAudit({
      actorId: approverId,
      action: "role:assigned",
      targetType: "user",
      targetId: request.targetId,
      metadata: { role: "AMBASSADOR", viaApprovalRequest: request.id },
    });

    await notify({
      userId: request.targetId,
      type: "approval:completed",
      title: "You've been promoted to Ambassador",
      body: "Your ambassador access is now active.",
    });
  }
}
