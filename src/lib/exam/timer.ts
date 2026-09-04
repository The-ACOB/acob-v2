import "server-only";
import { db } from "@/lib/db/client";
import { scoreAttempt } from "./scoring";
import type { Attempt, Olympiad } from "@prisma/client";

/**
 * Computed once, at attempt creation, and stored on the row. Every
 * later check compares the current server clock against this stored
 * value — never against anything the client sends — which is what
 * makes the exam timer authoritative rather than advisory.
 */
export function computeDeadline(olympiad: Olympiad, startedAt: Date): Date {
  const byDuration = new Date(startedAt.getTime() + olympiad.durationMinutes * 60 * 1000);
  if (olympiad.endAt && olympiad.endAt.getTime() < byDuration.getTime()) {
    return olympiad.endAt;
  }
  return byDuration;
}

/**
 * Lazily finalizes an attempt that has passed its deadline but is
 * still marked in_progress — there's no background job in this
 * deployment, so every attempt-touching read/write calls this first.
 * If the attempt is still within its window, this is a no-op.
 */
export async function autoSubmitIfExpired(attempt: Attempt, olympiad: Olympiad): Promise<Attempt> {
  if (attempt.status !== "in_progress") return attempt;
  if (Date.now() < attempt.deadlineAt.getTime()) return attempt;

  const questions: {
    id: string;
    marks: number;
    options: { id: string; isCorrect: boolean }[];
  }[] = await db.question.findMany({ where: { olympiadId: attempt.olympiadId }, include: { options: true } });

  const answers: { questionId: string; selectedOptionId: string | null }[] = await db.attemptAnswer.findMany({
    where: { attemptId: attempt.id },
  });

  const result = scoreAttempt(
    questions,
    answers,
    olympiad.negativeMarkingEnabled,
    olympiad.negativeMarkingValue
  );

  const updated = await db.attempt.update({
    where: { id: attempt.id },
    data: {
      status: "expired_auto_submitted",
      submittedAt: attempt.deadlineAt,
      score: result.score,
      totalMarks: result.totalMarks,
      correctCount: result.correctCount,
      incorrectCount: result.incorrectCount,
      unansweredCount: result.unansweredCount,
      timeSpentSeconds: Math.round((attempt.deadlineAt.getTime() - attempt.startedAt.getTime()) / 1000),
    },
  });

  return updated;
}
