"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db/client";
import { requireRole, AuthError } from "./guards";
import { ROLE_DEFINITIONS } from "./roles";
import { recordAudit } from "@/lib/audit";
import type { ActionResult } from "@/lib/auth/actions";

export async function setUserRoleAction(
  targetUserId: string,
  roleKey: string,
): Promise<ActionResult> {
  let actor;
  try {
    actor = await requireRole("CEO");
  } catch (err) {
    if (err instanceof AuthError) return { ok: false, error: err.message };
    throw err;
  }
  if (actor.id === targetUserId)
    return { ok: false, error: "The CEO account cannot change its own role." };
  if (!ROLE_DEFINITIONS.some((role) => role.key === roleKey))
    return { ok: false, error: "Invalid role." };

  const target = await db.user.findUnique({
    where: { id: targetUserId },
    include: { participant: true, ambassador: true },
  });
  if (!target) return { ok: false, error: "User not found." };
  const role = await db.role.findUnique({ where: { key: roleKey } });
  if (!role) return { ok: false, error: "Role is not configured." };
  const participantRole = await db.role.findUnique({
    where: { key: "PARTICIPANT" },
  });
  const ambassadorRole = await db.role.findUnique({
    where: { key: "AMBASSADOR" },
  });
  if (!participantRole || !ambassadorRole)
    return { ok: false, error: "Required roles are not configured." };

  await db.$transaction(async (tx) => {
    await tx.userRole.deleteMany({ where: { userId: targetUserId } });
    await tx.userRole.create({
      data: { userId: targetUserId, roleId: role.id, assignedBy: actor.id },
    });
    if (roleKey === "AMBASSADOR") {
      await tx.ambassador.upsert({
        where: { userId: targetUserId },
        create: {
          userId: targetUserId,
          institution: target.participant?.institution ?? null,
          status: "active",
          approvedBy: actor.id,
        },
        update: {
          status: "active",
          approvedBy: actor.id,
          institution: target.participant?.institution ?? undefined,
        },
      });
    } else if (target.ambassador) {
      await tx.ambassador.update({
        where: { userId: targetUserId },
        data: { status: "inactive" },
      });
    }
    if (roleKey === "PARTICIPANT") {
      await tx.userRole.upsert({
        where: {
          userId_roleId: { userId: targetUserId, roleId: participantRole.id },
        },
        create: {
          userId: targetUserId,
          roleId: participantRole.id,
          assignedBy: actor.id,
        },
        update: {},
      });
      await tx.participant.upsert({
        where: { userId: targetUserId },
        create: { userId: targetUserId },
        update: {},
      });
    }
  });

  await recordAudit({
    actorId: actor.id,
    action: "role:changed",
    targetType: "user",
    targetId: targetUserId,
    metadata: { role: roleKey, direct: true },
  });
  revalidatePath("/dashboard/participants");
  revalidatePath(`/dashboard/participants/${targetUserId}`);
  return { ok: true };
}
