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
export async function executeApprovedRequest(
  request: ApprovalRequestRow,
  approverId: string,
) {
  if (
    request.type === "ambassador_promotion" &&
    request.targetType === "user"
  ) {
    const ambassadorRole = await db.role.findUnique({
      where: { key: "AMBASSADOR" },
    });
    if (!ambassadorRole) return;

    const participant = await db.participant.findUnique({
      where: { userId: request.targetId },
    });
    await db.$transaction(async (tx) => {
      await tx.userRole.upsert({
        where: {
          userId_roleId: {
            userId: request.targetId,
            roleId: ambassadorRole.id,
          },
        },
        create: {
          userId: request.targetId,
          roleId: ambassadorRole.id,
          assignedBy: approverId,
        },
        update: { assignedBy: approverId, assignedAt: new Date() },
      });
      await tx.ambassador.upsert({
        where: { userId: request.targetId },
        create: {
          userId: request.targetId,
          institution: participant?.institution ?? null,
          status: "active",
          approvedBy: approverId,
        },
        update: {
          status: "active",
          approvedBy: approverId,
          institution: participant?.institution ?? undefined,
        },
      });
    });

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
