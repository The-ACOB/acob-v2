import type { Olympiad } from "@prisma/client";

export type OlympiadPhase =
  | "draft"
  | "upcoming"
  | "registration_open"
  | "registration_closed"
  | "live"
  | "closed";

type ScheduledOlympiad = Pick<
  Olympiad,
  "status" | "registrationStartAt" | "registrationEndAt" | "startAt" | "endAt"
>;

export function getOlympiadPhase(
  olympiad: ScheduledOlympiad,
  now = new Date(),
): OlympiadPhase {
  if (olympiad.status !== "published")
    return olympiad.status === "draft" ? "draft" : "closed";
  if (olympiad.registrationStartAt && now < olympiad.registrationStartAt)
    return "upcoming";
  if (olympiad.registrationEndAt && now < olympiad.registrationEndAt)
    return "registration_open";
  if (olympiad.startAt && now < olympiad.startAt) return "registration_closed";
  if (olympiad.endAt && now >= olympiad.endAt) return "closed";
  return "live";
}

export function isRegistrationOpen(
  olympiad: ScheduledOlympiad,
  now = new Date(),
): boolean {
  return getOlympiadPhase(olympiad, now) === "registration_open";
}

export function isExamLive(
  olympiad: ScheduledOlympiad,
  now = new Date(),
): boolean {
  return getOlympiadPhase(olympiad, now) === "live";
}
