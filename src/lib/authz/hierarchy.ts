import "server-only";

import {
  ROLE_RANK,
  ROLE_ASSIGNERS,
  EXECUTIVE_ROLES,
  type RoleKey,
} from "./roles";
import type { SessionUser } from "@/lib/auth/session";
import { AuthError } from "./guards";

function highestRank(roleKeys: string[]): number {
  return roleKeys.reduce(
    (max, key) => Math.max(max, ROLE_RANK[key as RoleKey] ?? 0),
    0,
  );
}

/**
 * Enforces ACOB's role-hierarchy rules for role assignment/removal.
 *
 * This is intentionally separate from requirePermission("role:assign"):
 * having the permission is necessary but not sufficient. The actor must
 * also satisfy the hierarchy rules for the specific action.
 */
export function assertCanAssignRole(actor: SessionUser, targetRole: RoleKey) {
  // Only executive roles may assign/remove roles.
  if (!ROLE_ASSIGNERS.some((role) => actor.roleKeys.includes(role))) {
    throw new AuthError("Only CEO, COO, or CTO may assign roles.", 403);
  }

  // Only the CEO may assign/promote someone into an executive role.
  if (EXECUTIVE_ROLES.includes(targetRole) && !actor.roleKeys.includes("CEO")) {
    throw new AuthError(
      "Only the CEO may assign executive roles (CEO, COO, CTO).",
      403,
    );
  }
}

/**
 * Enforces hierarchy rules when removing/changing an existing role.
 */
export function assertCanRemoveRole(
  actor: SessionUser,
  targetUserId: string,
  targetRoleKeys: string[],
) {
  // Only CEO, COO, or CTO may manage roles.
  if (!ROLE_ASSIGNERS.some((role) => actor.roleKeys.includes(role))) {
    throw new AuthError("Only CEO, COO, or CTO may remove roles.", 403);
  }

  // The CEO role can never be removed.
  const targetIsCeo = targetRoleKeys.includes("CEO");

  if (targetIsCeo) {
    throw new AuthError("The CEO role cannot be removed.", 403);
  }

  // No one may change their own role.
  if (actor.id === targetUserId) {
    throw new AuthError("You cannot change your own role.", 403);
  }

  // Only the CEO may modify or remove executive roles.
  //
  // This prevents:
  // - CTO → modifying COO
  // - COO → modifying CTO
  // - CTO → modifying another CTO
  // - COO → modifying another COO
  // - CTO/COO → modifying CEO
  //
  // The CEO is the only role allowed to modify executive roles.
  const targetIsExecutive = targetRoleKeys.some((role) =>
    EXECUTIVE_ROLES.includes(role as RoleKey),
  );

  if (targetIsExecutive && !actor.roleKeys.includes("CEO")) {
    throw new AuthError(
      "Only the CEO may modify or remove executive roles.",
      403,
    );
  }

  // Non-CEO executives cannot modify roles at or above their own rank.
  //
  // COO and CTO both have rank 90, so neither can modify the other.
  // Lower-ranked roles remain manageable by COO/CTO.
  if (!actor.roleKeys.includes("CEO")) {
    const actorRank = highestRank(actor.roleKeys);
    const targetRank = highestRank(targetRoleKeys);

    if (targetRank >= actorRank) {
      throw new AuthError(
        "You cannot modify a role at or above your own rank.",
        403,
      );
    }
  }
}

/**
 * No actor may change or self-assign their own role.
 */
export function assertNotSelfAssigning(
  actor: SessionUser,
  targetUserId: string,
) {
  if (actor.id === targetUserId) {
    throw new AuthError("You cannot assign or modify your own role.", 403);
  }
}
