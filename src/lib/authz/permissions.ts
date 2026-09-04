/**
 * Centralized permission catalogue. Every permission the application
 * can check against is declared here — nothing elsewhere should embed
 * a raw permission string literal outside this file and the seed data
 * that mirrors it into the database.
 */
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
  "user:view": "View user accounts",
  "user:create": "Create user accounts",
  "user:update": "Update user accounts",
  "user:delete": "Delete user accounts",
  "role:assign": "Assign a role to a user",
  "role:remove": "Remove a role from a user",
  "participant:create": "Create a participant record",
  "participant:view": "View participant records",
  "participant:update": "Update participant records",
  "participant:delete": "Delete participant records",
  "participant:referrals:view": "View which participants an ambassador referred",
  "olympiad:create": "Create an Olympiad",
  "olympiad:update": "Update an Olympiad",
  "olympiad:publish": "Publish an Olympiad",
  "olympiad:schedule": "Schedule an Olympiad",
  "olympiad:results:view": "View Olympiad results",
  "question:create": "Create a question",
  "question:update": "Update a question",
  "question:delete": "Delete a question",
  "question:publish": "Publish a question",
  "certificate:view": "View certificates",
  "certificate:issue": "Issue a certificate",
  "certificate:revoke": "Revoke a certificate",
  "certificate:verify": "Verify a certificate",
  "recommendation_letter:view": "View recommendation letters",
  "recommendation_letter:create": "Create a recommendation letter",
  "recommendation_letter:publish": "Publish a recommendation letter",
  "recommendation_letter:revoke": "Revoke a recommendation letter",
  "content:create": "Create site content",
  "content:update": "Update site content",
  "content:publish": "Publish or unpublish site content",
  "content:delete": "Archive site content",
  "podcast:create": "Create a podcast episode",
  "podcast:update": "Update a podcast episode",
  "podcast:delete": "Delete a podcast episode",
  "popup:manage": "Create, update, and toggle announcement popups",
  "contact:view": "View contact submissions",
  "contact:reply": "Reply to a contact submission",
  "support:view": "View support messages",
  "support:reply": "Reply to a support message",
  "approval:view": "View approval requests",
  "approval:approve": "Approve an approval request",
  "approval:reject": "Reject an approval request",
  "notifications:view": "View notifications",
  "notifications:manage": "Manage notification settings",
  "career:create": "Create a career listing",
  "career:update": "Update a career listing",
  "career:delete": "Delete a career listing",
};
