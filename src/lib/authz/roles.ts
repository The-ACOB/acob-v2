import type { Permission } from "./permissions";

/**
 * The fixed role set. `rank` encodes the hierarchy: strictly higher
 * rank means strictly more authority for hierarchy-sensitive operations
 * (e.g. "who can remove whom"). Ranks are sparse on purpose so new
 * roles can be inserted later without renumbering everything.
 */
export const ROLE_DEFINITIONS = [
  { key: "CEO", label: "Chief Executive Officer", rank: 100 },
  { key: "COO", label: "Chief Operating Officer", rank: 90 },
  { key: "CTO", label: "Chief Technology Officer", rank: 90 },
  { key: "HR_PR", label: "HR & PR", rank: 60 },
  { key: "CONTENT_MEDIA", label: "Content & Media", rank: 60 },
  { key: "SUPPORT", label: "Support", rank: 50 },
  { key: "ACADEMIC", label: "Academic Staff", rank: 60 },
  { key: "AMBASSADOR", label: "Ambassador", rank: 20 },
  { key: "PARTICIPANT", label: "Participant", rank: 10 },
] as const;

export type RoleKey = (typeof ROLE_DEFINITIONS)[number]["key"];

export const ROLE_RANK: Record<RoleKey, number> = Object.fromEntries(
  ROLE_DEFINITIONS.map((r) => [r.key, r.rank])
) as Record<RoleKey, number>;

/** Roles permitted to assign or remove another user's role. */
export const ROLE_ASSIGNERS: RoleKey[] = ["CEO", "COO", "CTO"];

const all = (perms: Permission[]) => perms;

/**
 * Default permission grants per role, seeded into `role_permissions`.
 * This is the only place role -> permission mapping is decided —
 * runtime checks always resolve through the database, this is just
 * what gets written there on seed/reseed.
 */
export const ROLE_PERMISSIONS: Record<RoleKey, Permission[]> = {
  CEO: all([
    "user:view", "user:create", "user:update", "user:delete",
    "role:assign", "role:remove",
    "participant:create", "participant:view", "participant:update", "participant:delete", "participant:referrals:view",
    "olympiad:create", "olympiad:update", "olympiad:publish", "olympiad:schedule", "olympiad:results:view",
    "question:create", "question:update", "question:delete", "question:publish",
    "certificate:view", "certificate:issue", "certificate:revoke", "certificate:verify",
    "recommendation_letter:view", "recommendation_letter:create", "recommendation_letter:publish", "recommendation_letter:revoke",
    "content:create", "content:update", "content:publish", "content:delete",
    "podcast:create", "podcast:update", "podcast:delete",
    "popup:manage",
    "contact:view", "contact:reply", "support:view", "support:reply",
    "approval:view", "approval:approve", "approval:reject",
    "notifications:view", "notifications:manage",
    "career:create", "career:update", "career:delete",
  ]),
  COO: all([
    "user:view", "user:create", "user:update",
    "role:assign", "role:remove",
    "participant:create", "participant:view", "participant:update", "participant:delete", "participant:referrals:view",
    "olympiad:create", "olympiad:update", "olympiad:publish", "olympiad:schedule", "olympiad:results:view",
    "certificate:view", "certificate:issue", "certificate:revoke", "certificate:verify",
    "recommendation_letter:view",
    "contact:view", "contact:reply", "support:view", "support:reply",
    "approval:view", "approval:approve", "approval:reject",
    "notifications:view", "notifications:manage",
    "career:create", "career:update", "career:delete",
  ]),
  CTO: all([
    "user:view", "user:update",
    "role:assign", "role:remove",
    "approval:view", "approval:approve", "approval:reject",
    "notifications:view", "notifications:manage",
  ]),
  HR_PR: all([
    "user:view", "user:update",
    "participant:view", "participant:create", "participant:update",
    "career:create", "career:update", "career:delete",
    "content:create", "content:update", "content:publish",
    "popup:manage",
    "contact:view", "contact:reply",
    "approval:view",
    "notifications:view",
  ]),
  CONTENT_MEDIA: all([
    "content:create", "content:update", "content:publish", "content:delete",
    "podcast:create", "podcast:update", "podcast:delete",
    "notifications:view",
  ]),
  SUPPORT: all([
    "contact:view", "contact:reply",
    "support:view", "support:reply",
    "notifications:view",
  ]),
  ACADEMIC: all([
    "olympiad:create", "olympiad:update", "olympiad:publish", "olympiad:schedule", "olympiad:results:view",
    "question:create", "question:update", "question:delete", "question:publish",
    "certificate:view", "certificate:issue", "certificate:revoke",
    "recommendation_letter:view", "recommendation_letter:create", "recommendation_letter:publish", "recommendation_letter:revoke",
    "notifications:view",
  ]),
  AMBASSADOR: all([
    "participant:create",
    "participant:referrals:view",
    "certificate:view",
    "recommendation_letter:view",
    "notifications:view",
  ]),
  PARTICIPANT: all([
    "certificate:view",
    "recommendation_letter:view",
    "notifications:view",
  ]),
};
