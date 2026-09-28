"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db/client";
import { requireRole, AuthError } from "./guards";
import {
  ROLE_DEFINITIONS,
  ROLE_ASSIGNERS,
  EXECUTIVE_ROLES,
  type RoleKey,
} from "./roles";
import { PERMISSIONS, type Permission } from "./permissions";
import {
  assertCanAssignRole,
  assertCanRemoveRole,
  assertNotSelfAssigning,
} from "./hierarchy";
import { recordAudit } from "@/lib/audit";
import type { ActionResult } from "@/lib/auth/actions";

const CONFIGURABLE_ROLES = ROLE_DEFINITIONS.filter(
  (role) => !EXECUTIVE_ROLES.includes(role.key),
);

function isConfigurableRole(roleKey: string): roleKey is Exclude<RoleKey, "CEO" | "COO" | "CTO"> {
  return CONFIGURABLE_ROLES.some((role) => role.key === roleKey);
}

function isPermission(value: string): value is Permission {
  return (PERMISSIONS as readonly string[]).includes(value);
}

async function requireExecutive() {
  try {
    return await requireRole(...EXECUTIVE_ROLES);
  } catch (err) {
    if (err instanceof AuthError) {
      throw err;
    }
    throw err;
  }
}

export async function setUserRoleAction(
  targetUserId: string,
  roleKey: string,
): Promise<ActionResult> {
  let actor;
  try {
    actor = await requireRole(...ROLE_ASSIGNERS);
  } catch (err) {
    if (err instanceof AuthError) return { ok: false, error: err.message };
    throw err;
  }

  if (!ROLE_DEFINITIONS.some((role) => role.key === roleKey)) {
    return { ok: false, error: "Invalid role." };
  }

  const target = await db.user.findUnique({
    where: { id: targetUserId },
    include: {
      userRoles: { include: { role: true } },
      participant: true,
      ambassador: true,
    },
  });

  if (!target) return { ok: false, error: "User not found." };

  const targetRoleKeys = target.userRoles.map((ur) => ur.role.key);

  try {
    assertNotSelfAssigning(actor, targetUserId);
    assertCanRemoveRole(actor, targetUserId, targetRoleKeys);
    assertCanAssignRole(actor, roleKey as RoleKey);
  } catch (err) {
    if (err instanceof AuthError) return { ok: false, error: err.message };
    throw err;
  }

  const role = await db.role.findUnique({ where: { key: roleKey } });

  if (!role) {
    return { ok: false, error: "Role is not configured." };
  }

  const participantRole = await db.role.findUnique({
    where: { key: "PARTICIPANT" },
  });

  const ambassadorRole = await db.role.findUnique({
    where: { key: "AMBASSADOR" },
  });

  if (!participantRole || !ambassadorRole) {
    return { ok: false, error: "Required roles are not configured." };
  }

  await db.$transaction(async (tx) => {
    await tx.userRole.deleteMany({ where: { userId: targetUserId } });

    await tx.userRole.create({
      data: {
        userId: targetUserId,
        roleId: role.id,
        assignedBy: actor.id,
      },
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
          userId_roleId: {
            userId: targetUserId,
            roleId: participantRole.id,
          },
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

export async function getRoleControlsAction() {
  const actor = await requireExecutive();

  const roles = await db.role.findMany({
    where: {
      key: {
        in: CONFIGURABLE_ROLES.map((role) => role.key),
      },
    },
    include: {
      rolePermissions: {
        include: {
          permission: true,
        },
      },
    },
    orderBy: {
      rank: "desc",
    },
  });

  return {
    actorId: actor.id,
    permissions: PERMISSIONS,
    roles: roles.map((role) => ({
      key: role.key,
      label: role.label,
      permissions: role.rolePermissions.map(
        (rolePermission) => rolePermission.permission.key,
      ),
    })),
  };
}

export async function updateRolePermissionsAction(
  roleKey: string,
  permissionKeys: string[],
): Promise<ActionResult> {
  let actor;

  try {
    actor = await requireExecutive();
  } catch (err) {
    if (err instanceof AuthError) {
      return { ok: false, error: err.message };
    }
    throw err;
  }

  if (!isConfigurableRole(roleKey)) {
    return {
      ok: false,
      error: "Only non-executive roles can be configured here.",
    };
  }

  const invalidPermissions = permissionKeys.filter(
    (permission) => !isPermission(permission),
  );

  if (invalidPermissions.length > 0) {
    return {
      ok: false,
      error: `Invalid permission: ${invalidPermissions[0]}`,
    };
  }

  const role = await db.role.findUnique({
    where: { key: roleKey },
  });

  if (!role) {
    return {
      ok: false,
      error: "Role is not configured.",
    };
  }

  const uniquePermissionKeys = [...new Set(permissionKeys)];

  await db.$transaction(async (tx) => {
    await tx.rolePermission.deleteMany({
      where: {
        roleId: role.id,
      },
    });

    if (uniquePermissionKeys.length === 0) {
      return;
    }

    const permissions = await tx.permission.findMany({
      where: {
        key: {
          in: uniquePermissionKeys,
        },
      },
      select: {
        id: true,
      },
    });

    await tx.rolePermission.createMany({
      data: permissions.map((permission) => ({
        roleId: role.id,
        permissionId: permission.id,
      })),
    });
  });

  await recordAudit({
    actorId: actor.id,
    action: "role:permissions_changed",
    targetType: "role",
    targetId: role.id,
    metadata: {
      role: roleKey,
      permissions: uniquePermissionKeys,
    },
  });

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/role-controls");

  return { ok: true };
}
