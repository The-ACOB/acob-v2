/**
 * Centralized notification type catalogue. Each type maps to a
 * template/trigger — nothing elsewhere should invent a raw string
 * outside this list, so the set of things ACOB can notify someone
 * about stays deliberate and auditable.
 */
export const NOTIFICATION_TYPES = [
  "olympiad:published",
  "olympiad:starting_soon",
  "olympiad:results_published",
  "certificate:available",
  "recommendation_letter:available",
  "approval:requested",
  "approval:completed",
  "contact:new",
  "contact:response",
  "support:new_message",
  "support:response",
  "security:notice",
] as const;

export type NotificationType = (typeof NOTIFICATION_TYPES)[number];
