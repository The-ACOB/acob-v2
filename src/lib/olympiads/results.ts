import "server-only";

import { db } from "@/lib/db/client";
import { autoSubmitIfExpired } from "@/lib/exam/timer";

export type ResultAward =
  | "Prime"
  | "Elite"
  | "Merit"
  | "Honourable Mention"
  | "Participation"
  | null;

export function awardForRank(rank: number | null): ResultAward {
  if (!rank) return null;
  if (rank === 1) return "Prime";
  if (rank === 2) return "Elite";
  if (rank === 3) return "Merit";
  if (rank <= 10) return "Honourable Mention";
  return "Participation";
}

/**
 * An Olympiad is eligible for automatic finalisation once its configured
 * closing time has passed. There is deliberately no cross-Olympiad ranking:
 * every call is scoped to exactly one olympiadId.
 */
export function isOlympiadFinished(endAt: Date | null): boolean {
  return Boolean(endAt && endAt.getTime() <= Date.now());
}

/**
 * Finalise one Olympiad's results.
 *
 * Rules:
 * - submitted and expired-auto-submitted attempts are ranked;
 * - disqualified attempts are never ranked;
 * - registered users who never started an attempt receive no rank/award;
 * - ranks are calculated only inside this Olympiad;
 * - scores are ordered high-to-low, then by submission time, then id so
 *   every position is deterministic and unique.
 *
 * This is safe to call repeatedly. It repairs stale ranks before publishing.
 */
export async function finalizeOlympiadResults(olympiadId: string) {
  const olympiad = await db.olympiad.findUnique({ where: { id: olympiadId } });
  if (!olympiad) return { finalized: false as const, reason: "not_found" as const };

  if (!isOlympiadFinished(olympiad.endAt)) {
    return { finalized: false as const, reason: "not_finished" as const };
  }

  const inProgress = await db.attempt.findMany({
    where: { olympiadId, status: "in_progress" },
  });

  for (const attempt of inProgress) {
    await autoSubmitIfExpired(attempt, olympiad);
  }

  const rankable = await db.attempt.findMany({
    where: {
      olympiadId,
      status: { in: ["submitted", "expired_auto_submitted"] },
      score: { not: null },
    },
    select: {
      id: true,
      userId: true,
      score: true,
      submittedAt: true,
    },
  });

  const ranked = [...rankable].sort((a, b) => {
    const scoreDiff = (b.score ?? Number.NEGATIVE_INFINITY) - (a.score ?? Number.NEGATIVE_INFINITY);
    if (scoreDiff !== 0) return scoreDiff;

    const submittedA = a.submittedAt?.getTime() ?? Number.MAX_SAFE_INTEGER;
    const submittedB = b.submittedAt?.getTime() ?? Number.MAX_SAFE_INTEGER;
    if (submittedA !== submittedB) return submittedA - submittedB;

    return a.id.localeCompare(b.id);
  });

  await db.$transaction(async (tx) => {
    // Clear any old rank first so disqualified / otherwise ineligible
    // attempts can never retain a stale position.
    await tx.attempt.updateMany({
      where: { olympiadId },
      data: { rank: null, scoreLocked: false },
    });

    for (let index = 0; index < ranked.length; index += 1) {
      await tx.attempt.update({
        where: { id: ranked[index].id },
        data: {
          rank: index + 1,
          scoreLocked: true,
        },
      });
    }

  });

  return {
    finalized: true as const,
    reason: "finished" as const,
    rankedCount: ranked.length,
  };
}
