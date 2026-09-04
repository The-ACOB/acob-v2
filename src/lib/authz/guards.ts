import "server-only";
import { getCurrentSession, type SessionUser } from "@/lib/auth/session";
import { db } from "@/lib/db/client";
import type { Permission } from "./permissions";
import type { RoleKey } from "./roles";

export class AuthError extends Error {
  status: number;
  constructor(message: string, status = 401) {
    super(message);
    this.status = status;
  }
}

/**
 * Every one of these guards is meant to be called at the top of a
 * server action / route handler, never trusted from the client. A
 * hidden button is not authorization — these functions are.
 */
export async function requireAuth(): Promise<SessionUser> {
  const session = await getCurrentSession();
  if (!session) throw new AuthError("Authentication required.", 401);
  if (session.status !== "active") throw new AuthError("Account is not active.", 403);
  return session;
}

export async function requireRole(...allowed: RoleKey[]): Promise<SessionUser> {
  const session = await requireAuth();
  const hasRole = session.roleKeys.some((r) => allowed.includes(r as RoleKey));
  if (!hasRole) throw new AuthError("You do not have the required role.", 403);
  return session;
}

/** Resolves the full permission set granted to a user's roles, via the database — never hard-coded. */
async function resolvePermissions(roleKeys: string[]): Promise<Set<string>> {
  if (roleKeys.length === 0) return new Set();

  const rows = await db.rolePermission.findMany({
    where: { role: { key: { in: roleKeys } } },
    include: { permission: true },
  });

  return new Set(rows.map((r: { permission: { key: string } }) => r.permission.key));
}

export async function requirePermission(permission: Permission): Promise<SessionUser> {
  const session = await requireAuth();
  const granted = await resolvePermissions(session.roleKeys);
  if (!granted.has(permission)) {
    throw new AuthError(`Missing permission: ${permission}`, 403);
  }
  return session;
}

export async function requireAnyPermission(...allowed: Permission[]): Promise<SessionUser> {
  const session = await requireAuth();
  const granted = await resolvePermissions(session.roleKeys);
  const ok = allowed.some((p) => granted.has(p));
  if (!ok) {
    throw new AuthError(`Missing one of permissions: ${allowed.join(", ")}`, 403);
  }
  return session;
}

/**
 * Ownership check for the common "a user can act on their own record"
 * and "an ambassador can act on participants they referred" shapes.
 * `resolveOwnerId` looks up the owning user id for the target record;
 * a permission bypass (e.g. CEO) can be supplied via `bypassRoles`.
 */
export async function requireOwnership(params: {
  resolveOwnerId: () => Promise<string | null>;
  bypassRoles?: RoleKey[];
}): Promise<SessionUser> {
  const session = await requireAuth();

  if (params.bypassRoles?.some((r) => session.roleKeys.includes(r))) {
    return session;
  }

  const ownerId = await params.resolveOwnerId();
  if (!ownerId || ownerId !== session.id) {
    throw new AuthError("You do not have access to this resource.", 403);
  }
  return session;
}

/** True/false variant for use inside UI logic (never a substitute for the guards above in mutations). */
export async function hasPermission(permission: Permission): Promise<boolean> {
  const session = await getCurrentSession();
  if (!session) return false;
  const granted = await resolvePermissions(session.roleKeys);
  return granted.has(permission);
}
