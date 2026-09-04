"use server";

import { requireAuth, AuthError } from "@/lib/authz/guards";
import { db } from "@/lib/db/client";
import { computeDeadline, autoSubmitIfExpired } from "./timer";
import { scoreAttempt } from "./scoring";
import type { ActionResult } from "@/lib/auth/actions";
import type { Olympiad } from "@prisma/client";

const EXAM_ROLES = ["PARTICIPANT", "AMBASSADOR"];

/** Lazily flips a scheduled Olympiad to "published" once its publishAt has passed — mirrors the auto-submit pattern, no cron required. */
async function resolveEffectiveOlympiad(id: string): Promise<Olympiad | null> {
  const olympiad = await db.olympiad.findUnique({ where: { id } });
  if (!olympiad) return null;
  if (olympiad.status === "draft" && olympiad.publishAt && olympiad.publishAt.getTime() <= Date.now()) {
    return db.olympiad.update({ where: { id }, data: { status: "published" } });
  }
  return olympiad;
}

function isWithinExamWindow(olympiad: Olympiad): boolean {
  const now = Date.now();
  if (olympiad.startAt && now < olympiad.startAt.getTime()) return false;
  if (olympiad.endAt && now >= olympiad.endAt.getTime()) return false;
  return true;
}

export async function startAttemptAction(olympiadId: string): Promise<ActionResult<{ attemptId: string }>> {
  let session;
  try {
    session = await requireAuth();
  } catch (err) {
    if (err instanceof AuthError) return { ok: false, error: err.message };
    throw err;
  }

  if (!session.roleKeys.some((r) => EXAM_ROLES.includes(r))) {
    return { ok: false, error: "Only participants and ambassadors can take Olympiads." };
  }

  const olympiad = await resolveEffectiveOlympiad(olympiadId);
  if (!olympiad || olympiad.status !== "published") {
    return { ok: false, error: "This Olympiad is not currently available." };
  }

  const existing = await db.attempt.findUnique({
    where: { olympiadId_userId: { olympiadId, userId: session.id } },
  });

  if (existing) {
    const refreshed = await autoSubmitIfExpired(existing, olympiad);
    if (refreshed.status !== "in_progress") {
      return { ok: false, error: "You have already attempted this Olympiad." };
    }
    return { ok: true, data: { attemptId: refreshed.id } };
  }

  if (!isWithinExamWindow(olympiad)) {
    return { ok: false, error: "This Olympiad is not open for new attempts right now." };
  }

  const startedAt = new Date();
  const deadlineAt = computeDeadline(olympiad, startedAt);
  const attempt = await db.attempt.create({ data: { olympiadId, userId: session.id, deadlineAt } });

  return { ok: true, data: { attemptId: attempt.id } };
}

/**
 * Debounced from the client — called on question navigation or every
 * ~15s while an answer is selected, never per keystroke/millisecond.
 */
export async function saveAnswerAction(
  attemptId: string,
  questionId: string,
  selectedOptionId: string | null,
  timeSpentDeltaSeconds: number
): Promise<ActionResult> {
  let session;
  try {
    session = await requireAuth();
  } catch (err) {
    if (err instanceof AuthError) return { ok: false, error: err.message };
    throw err;
  }

  const attempt = await db.attempt.findUnique({ where: { id: attemptId } });
  if (!attempt || attempt.userId !== session.id) {
    return { ok: false, error: "Attempt not found." };
  }

  const olympiad = await db.olympiad.findUnique({ where: { id: attempt.olympiadId } });
  if (!olympiad) return { ok: false, error: "Olympiad not found." };

  const current = await autoSubmitIfExpired(attempt, olympiad);
  if (current.status !== "in_progress") {
    return { ok: false, error: "Time has expired for this attempt." };
  }

  const question: { id: string; olympiadId: string; options: { id: string }[] } | null =
    await db.question.findUnique({ where: { id: questionId }, include: { options: true } });
  if (!question || question.olympiadId !== attempt.olympiadId) {
    return { ok: false, error: "Question does not belong to this attempt." };
  }

  if (selectedOptionId && !question.options.some((o) => o.id === selectedOptionId)) {
    return { ok: false, error: "Invalid option for this question." };
  }

  const existingAnswer = await db.attemptAnswer.findUnique({
    where: { attemptId_questionId: { attemptId, questionId } },
  });

  const changed = Boolean(existingAnswer && existingAnswer.selectedOptionId !== selectedOptionId);
  const now = new Date();

  await db.attemptAnswer.upsert({
    where: { attemptId_questionId: { attemptId, questionId } },
    update: {
      selectedOptionId,
      timeSpentSeconds: (existingAnswer?.timeSpentSeconds ?? 0) + Math.max(0, Math.round(timeSpentDeltaSeconds)),
      changeCount: (existingAnswer?.changeCount ?? 0) + (changed ? 1 : 0),
      lastInteractionAt: now,
    },
    create: {
      attemptId,
      questionId,
      selectedOptionId,
      timeSpentSeconds: Math.max(0, Math.round(timeSpentDeltaSeconds)),
      changeCount: 0,
      firstAnsweredAt: now,
      lastInteractionAt: now,
    },
  });

  return { ok: true };
}

/**
 * Scores are computed here, server-side, from the question's own
 * option data — never returned to the client in this response. A
 * participant only ever learns their score from the results page,
 * and only once the Olympiad's results have been officially published.
 */
export async function submitAttemptAction(attemptId: string): Promise<ActionResult> {
  let session;
  try {
    session = await requireAuth();
  } catch (err) {
    if (err instanceof AuthError) return { ok: false, error: err.message };
    throw err;
  }

  const attempt = await db.attempt.findUnique({ where: { id: attemptId } });
  if (!attempt || attempt.userId !== session.id) {
    return { ok: false, error: "Attempt not found." };
  }

  const olympiad = await db.olympiad.findUnique({ where: { id: attempt.olympiadId } });
  if (!olympiad) return { ok: false, error: "Olympiad not found." };

  const current = await autoSubmitIfExpired(attempt, olympiad);
  if (current.status !== "in_progress") {
    return { ok: false, error: "This attempt has already been submitted." };
  }

  const questions: {
    id: string;
    marks: number;
    options: { id: string; isCorrect: boolean }[];
  }[] = await db.question.findMany({ where: { olympiadId: attempt.olympiadId }, include: { options: true } });

  const answers: { questionId: string; selectedOptionId: string | null }[] = await db.attemptAnswer.findMany({
    where: { attemptId },
  });

  const result = scoreAttempt(questions, answers, olympiad.negativeMarkingEnabled, olympiad.negativeMarkingValue);
  const submittedAt = new Date();

  await db.attempt.update({
    where: { id: attemptId },
    data: {
      status: "submitted",
      submittedAt,
      score: result.score,
      totalMarks: result.totalMarks,
      correctCount: result.correctCount,
      incorrectCount: result.incorrectCount,
      unansweredCount: result.unansweredCount,
      timeSpentSeconds: Math.round((submittedAt.getTime() - attempt.startedAt.getTime()) / 1000),
    },
  });

  for (const [questionId, outcome] of result.perQuestion) {
    if (!answers.some((a) => a.questionId === questionId)) continue; // don't create rows for unanswered questions
    await db.attemptAnswer.upsert({
      where: { attemptId_questionId: { attemptId, questionId } },
      update: { isCorrect: outcome.isCorrect, marksAwarded: outcome.marksAwarded },
      create: { attemptId, questionId, isCorrect: outcome.isCorrect, marksAwarded: outcome.marksAwarded },
    });
  }

  return { ok: true };
}

export type SanitizedOption = { id: string; text: string };
export type SanitizedQuestion = {
  id: string;
  text: string;
  imageUrl: string | null;
  marks: number;
  order: number;
  options: SanitizedOption[];
};

/**
 * Fetches everything the exam-taking UI needs, with `isCorrect` and
 * `explanation` stripped from every question before it ever leaves
 * the server — this is what prevents a participant from reading
 * correct answers out of the page source or the RSC payload.
 */
export async function getExamData(attemptId: string): Promise<
  | {
      ok: true;
      attempt: { id: string; deadlineAt: string; status: string };
      questions: SanitizedQuestion[];
      existingAnswers: Record<string, string | null>;
    }
  | { ok: false; error: string }
> {
  const session = await requireAuth().catch(() => null);
  if (!session) return { ok: false, error: "Authentication required." };

  const attempt = await db.attempt.findUnique({ where: { id: attemptId } });
  if (!attempt || attempt.userId !== session.id) {
    return { ok: false, error: "Attempt not found." };
  }

  const olympiad = await db.olympiad.findUnique({ where: { id: attempt.olympiadId } });
  if (!olympiad) return { ok: false, error: "Olympiad not found." };

  const current = await autoSubmitIfExpired(attempt, olympiad);
  if (current.status !== "in_progress") {
    return { ok: false, error: "This attempt is no longer in progress." };
  }

  const rawQuestions: {
    id: string;
    text: string;
    imageUrl: string | null;
    marks: number;
    order: number;
    options: { id: string; text: string; isCorrect: boolean }[];
  }[] = await db.question.findMany({ where: { olympiadId: attempt.olympiadId }, include: { options: true } });

  const questions: SanitizedQuestion[] = rawQuestions
    .sort((a, b) => a.order - b.order)
    .map((q) => ({
      id: q.id,
      text: q.text,
      imageUrl: q.imageUrl,
      marks: q.marks,
      order: q.order,
      options: q.options.map((o) => ({ id: o.id, text: o.text })), // isCorrect deliberately omitted
    }));

  const answers: { questionId: string; selectedOptionId: string | null }[] = await db.attemptAnswer.findMany({
    where: { attemptId: current.id },
  });
  const existingAnswers: Record<string, string | null> = {};
  for (const a of answers) existingAnswers[a.questionId] = a.selectedOptionId;

  return {
    ok: true,
    attempt: { id: current.id, deadlineAt: current.deadlineAt.toISOString(), status: current.status },
    questions,
    existingAnswers,
  };
}
