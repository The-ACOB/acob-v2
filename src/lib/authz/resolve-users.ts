import "server-only";
import { db } from "@/lib/db/client";
import type { Permission } from "./permissions";

/**
 * Resolves every user who holds a role granting the given permission.
 * Used to fan out notifications to "whoever can see this" (e.g. every
 * support-permission holder when a new contact message arrives)
 * without hard-coding which roles those are — it always follows the
 * same role_permissions data the authorization guards use.
 */
export async function getUsersWithPermission(permission: Permission): Promise<{ userId: string }[]> {
  const perm = await db.permission.findUnique({ where: { key: permission } });
  if (!perm) return [];

  const rolePerms: { roleId: string }[] = await db.rolePermission.findMany({
    where: { permissionId: perm.id },
  });
  const roleIds = rolePerms.map((rp) => rp.roleId);
  if (roleIds.length === 0) return [];

  const userRoles: { userId: string }[] = await db.userRole.findMany({
    where: { roleId: { in: roleIds } },
  });

  const seen = new Set<string>();
  return userRoles.filter((ur) => {
    if (seen.has(ur.userId)) return false;
    seen.add(ur.userId);
    return true;
  });
}
