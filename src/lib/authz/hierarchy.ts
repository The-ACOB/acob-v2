import "server-only";
import { ROLE_RANK, ROLE_ASSIGNERS, type RoleKey } from "./roles";
import type { SessionUser } from "@/lib/auth/session";
import { AuthError } from "./guards";

function highestRank(roleKeys: string[]): number {
  return roleKeys.reduce((max, key) => Math.max(max, ROLE_RANK[key as RoleKey] ?? 0), 0);
}

/**
 * Enforces ACOB's role-hierarchy rules for role assignment/removal.
 * This is intentionally separate from `requirePermission("role:assign")`
 * — holding the permission is necessary but not sufficient; the actor
 * also has to outrank (or be exempt for) the specific action.
 */
export function assertCanAssignRole(actor: SessionUser, targetRole: RoleKey) {
  if (!ROLE_ASSIGNERS.some((r) => actor.roleKeys.includes(r))) {
    throw new AuthError("Only CEO, COO, or CTO may assign roles.", 403);
  }
  if (targetRole === "CEO" && !actor.roleKeys.includes("CEO")) {
    throw new AuthError("Only the CEO may assign the CEO role.", 403);
  }
}

export function assertCanRemoveRole(actor: SessionUser, targetUserId: string, targetRoleKeys: string[]) {
  if (!ROLE_ASSIGNERS.some((r) => actor.roleKeys.includes(r))) {
    throw new AuthError("Only CEO, COO, or CTO may remove roles.", 403);
  }

  const targetIsCeo = targetRoleKeys.includes("CEO");
  if (targetIsCeo) {
    throw new AuthError("The CEO role cannot be removed.", 403);
  }

  if (actor.id === targetUserId) {
    throw new AuthError("You cannot change your own role.", 403);
  }

  // COO/CTO cannot act on peers or superiors in rank (e.g. cannot demote another COO/CTO).
  if (!actor.roleKeys.includes("CEO")) {
    const actorRank = highestRank(actor.roleKeys);
    const targetRank = highestRank(targetRoleKeys);
    if (targetRank >= actorRank) {
      throw new AuthError("You cannot modify a role at or above your own rank.", 403);
    }
  }
}

/** No role may be self-assigned by a normal (non-CEO/COO/CTO) actor. */
export function assertNotSelfAssigning(actor: SessionUser, targetUserId: string) {
  if (actor.id === targetUserId && !ROLE_ASSIGNERS.some((r) => actor.roleKeys.includes(r))) {
    throw new AuthError("You cannot assign yourself a role.", 403);
  }
}
