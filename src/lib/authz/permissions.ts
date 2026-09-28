export const PERMISSIONS = [
  // Users
  "user:view",
  "user:create",
  "user:update",
  "user:delete",
  "role:assign",
  "role:remove",

  // Participants
  "participant:create",
  "participant:view",
  "participant:update",
  "participant:delete",
  "participant:referrals:view",

  // Olympiads
  "olympiad:create",
  "olympiad:update",
  "olympiad:publish",
  "olympiad:schedule",
  "olympiad:results:view",

  // Questions
  "question:create",
  "question:update",
  "question:delete",
  "question:publish",

  // Payments
  "payment:view",
  "payment:approve",

  // Certificates
  "certificate:view",
  "certificate:issue",
  "certificate:revoke",
  "certificate:verify",

  // Recommendation letters
  "recommendation_letter:view",
  "recommendation_letter:create",
  "recommendation_letter:publish",
  "recommendation_letter:revoke",

  // Content
  "content:create",
  "content:update",
  "content:publish",
  "content:delete",
  "podcast:create",
  "podcast:update",
  "podcast:delete",

  // Popups
  "popup:manage",

  // Contact / support
  "contact:view",
  "contact:reply",
  "support:view",
  "support:reply",

  // Approvals
  "approval:view",
  "approval:approve",
  "approval:reject",

  // Notifications
  "notifications:view",
  "notifications:manage",

  // Careers
  "career:create",
  "career:update",
  "career:delete",
] as const;

export type Permission = (typeof PERMISSIONS)[number];

export const PERMISSION_DESCRIPTIONS: Record<Permission, string> = {
  // Users
  "user:view": "View organisation users",
  "user:create": "Create organisation users",
  "user:update": "Update organisation users",
  "user:delete": "Delete organisation users",
  "role:assign": "Assign roles to users",
  "role:remove": "Remove roles from users",

  // Participants
  "participant:create": "Create participants",
  "participant:view": "View participants",
  "participant:update": "Update participants",
  "participant:delete": "Delete participants",
  "participant:referrals:view": "View participant referral information",

  // Olympiads
  "olympiad:create": "Create Olympiads",
  "olympiad:update": "Update Olympiads",
  "olympiad:publish": "Publish Olympiads",
  "olympiad:schedule": "Schedule Olympiads",
  "olympiad:results:view": "View Olympiad results and rankings",

  // Questions
  "question:create": "Create Olympiad questions",
  "question:update": "Update Olympiad questions",
  "question:delete": "Delete Olympiad questions",
  "question:publish": "Publish Olympiad questions",

  // Payments
  "payment:view":
    "View Olympiad payment submissions and payment approval records",
  "payment:approve": "Approve or reject Olympiad payment submissions",

  // Certificates
  "certificate:view": "View certificates",
  "certificate:issue": "Issue certificates",
  "certificate:revoke": "Revoke certificates",
  "certificate:verify": "Verify certificates",

  // Recommendation letters
  "recommendation_letter:view": "View recommendation letters",
  "recommendation_letter:create": "Create recommendation letters",
  "recommendation_letter:publish": "Publish recommendation letters",
  "recommendation_letter:revoke": "Revoke recommendation letters",

  // Content
  "content:create": "Create content",
  "content:update": "Update content",
  "content:publish": "Publish content",
  "content:delete": "Delete content",
  "podcast:create": "Create podcasts",
  "podcast:update": "Update podcasts",
  "podcast:delete": "Delete podcasts",

  // Popups
  "popup:manage": "Create, update, and toggle announcement popups",

  // Contact / support
  "contact:view": "View contact messages",
  "contact:reply": "Reply to contact messages",
  "support:view": "View support requests",
  "support:reply": "Reply to support requests",

  // Approvals
  "approval:view": "View approval requests",
  "approval:approve": "Approve requests",
  "approval:reject": "Reject requests",

  // Notifications
  "notifications:view": "View notifications",
  "notifications:manage": "Manage notifications",

  // Careers
  "career:create": "Create career postings",
  "career:update": "Update career postings",
  "career:delete": "Delete career postings",
};

/**
 * Backwards-compatible alias.
 *
 * Some existing files use the camelCase name while the
 * Role Controls page and database seed use the uppercase name.
 */
export const permissionDescriptions = PERMISSION_DESCRIPTIONS;
