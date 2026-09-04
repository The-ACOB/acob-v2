"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db/client";
import { requirePermission, AuthError } from "@/lib/authz/guards";
import { recordAudit } from "@/lib/audit";
import { notify } from "@/lib/notifications";
import { getUsersWithPermission } from "@/lib/authz/resolve-users";
import { olympiadSchema, questionSchema } from "./validation";
import type { ActionResult } from "@/lib/auth/actions";

function slugify(title: string): string {
  return (
    title
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "") || "olympiad"
  );
}

async function uniqueSlug(title: string): Promise<string> {
  const base = slugify(title);
  let slug = base;
  let i = 1;

  while (await db.olympiad.findUnique({ where: { slug } })) {
    slug = `${base}-${i++}`;
  }

  return slug;
}

export async function createOlympiadAction(
  input: unknown,
): Promise<ActionResult<{ id: string }>> {
  let actor;

  try {
    actor = await requirePermission("olympiad:create");
  } catch (err) {
    if (err instanceof AuthError) return { ok: false, error: err.message };
    throw err;
  }

  const parsed = olympiadSchema.safeParse(input);

  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Invalid input.",
    };
  }

  const v = parsed.data;
  const slug = await uniqueSlug(v.title);

  const olympiad = await db.olympiad.create({
    data: {
      title: v.title,
      slug,
      description: v.description || null,
      subject: v.subject || null,
      durationMinutes: v.durationMinutes,
      startAt: v.startAt ? new Date(v.startAt) : null,
      endAt: v.endAt ? new Date(v.endAt) : null,
      negativeMarkingEnabled: v.negativeMarkingEnabled ?? false,
      negativeMarkingValue: v.negativeMarkingValue ?? 0,
      eligibilityMode: v.eligibilityMode ?? "open",
      eligibilityGradeLevel: v.eligibilityGradeLevel || null,
      eligibilityInstitution: v.eligibilityInstitution || null,
      eligibilityAcademicLevel: v.eligibilityAcademicLevel || null,
      createdBy: actor.id,
    },
  });

  await recordAudit({
    actorId: actor.id,
    action: "olympiad:created",
    targetType: "olympiad",
    targetId: olympiad.id,
  });

  revalidatePath("/dashboard/olympiads");

  return { ok: true, data: { id: olympiad.id } };
}

export async function updateOlympiadAction(
  id: string,
  input: unknown,
): Promise<ActionResult> {
  let actor;

  try {
    actor = await requirePermission("olympiad:update");
  } catch (err) {
    if (err instanceof AuthError) return { ok: false, error: err.message };
    throw err;
  }

  const olympiad = await db.olympiad.findUnique({
    where: { id },
  });

  if (!olympiad) {
    return { ok: false, error: "Olympiad not found." };
  }

  if (olympiad.status === "published") {
    return {
      ok: false,
      error: "Unpublish the Olympiad before editing its settings.",
    };
  }

  const parsed = olympiadSchema.safeParse(input);

  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Invalid input.",
    };
  }

  const v = parsed.data;

  await db.olympiad.update({
    where: { id },
    data: {
      title: v.title,
      description: v.description || null,
      subject: v.subject || null,
      durationMinutes: v.durationMinutes,
      startAt: v.startAt ? new Date(v.startAt) : null,
      endAt: v.endAt ? new Date(v.endAt) : null,
      negativeMarkingEnabled: v.negativeMarkingEnabled ?? false,
      negativeMarkingValue: v.negativeMarkingValue ?? 0,
      eligibilityMode: v.eligibilityMode ?? "open",
      eligibilityGradeLevel: v.eligibilityGradeLevel || null,
      eligibilityInstitution: v.eligibilityInstitution || null,
      eligibilityAcademicLevel: v.eligibilityAcademicLevel || null,
      participationMode: v.participationMode ?? "individual",
    },
  });

  await recordAudit({
    actorId: actor.id,
    action: "olympiad:updated",
    targetType: "olympiad",
    targetId: id,
  });

  revalidatePath(`/dashboard/olympiads/${id}`);

  return { ok: true };
}

export async function publishOlympiadAction(
  id: string,
  publishAt?: string,
): Promise<ActionResult> {
  let actor;

  try {
    actor = await requirePermission("olympiad:publish");
  } catch (err) {
    if (err instanceof AuthError) return { ok: false, error: err.message };
    throw err;
  }

  const olympiad = await db.olympiad.findUnique({
    where: { id },
  });

  if (!olympiad) {
    return { ok: false, error: "Olympiad not found." };
  }

  const questionCount = await db.question.count({
    where: { olympiadId: id },
  });

  if (questionCount === 0) {
    return {
      ok: false,
      error: "Add at least one question before publishing.",
    };
  }

  const scheduled = publishAt ? new Date(publishAt) : null;
  const isFuture = scheduled && scheduled.getTime() > Date.now();

  await db.olympiad.update({
    where: { id },
    data: isFuture
      ? { status: "draft", publishAt: scheduled }
      : { status: "published", publishAt: new Date() },
  });

  await recordAudit({
    actorId: actor.id,
    action: isFuture ? "olympiad:scheduled" : "olympiad:published",
    targetType: "olympiad",
    targetId: id,
  });

  if (!isFuture) {
    const staff = await getUsersWithPermission("olympiad:results:view");

    await Promise.all(
      staff.map((s) =>
        notify({
          userId: s.userId,
          type: "olympiad:published",
          title: "Olympiad published",
          body: olympiad.title,
          metadata: { olympiadId: id },
        }),
      ),
    );
  }

  revalidatePath(`/dashboard/olympiads/${id}`);
  revalidatePath("/dashboard/olympiads");

  return { ok: true };
}

export async function unpublishOlympiadAction(
  id: string,
): Promise<ActionResult> {
  let actor;

  try {
    actor = await requirePermission("olympiad:publish");
  } catch (err) {
    if (err instanceof AuthError) return { ok: false, error: err.message };
    throw err;
  }

  await db.olympiad.update({
    where: { id },
    data: { status: "unpublished" },
  });

  await recordAudit({
    actorId: actor.id,
    action: "olympiad:unpublished",
    targetType: "olympiad",
    targetId: id,
  });

  revalidatePath(`/dashboard/olympiads/${id}`);
  revalidatePath("/dashboard/olympiads");

  return { ok: true };
}

export async function createQuestionAction(
  olympiadId: string,
  input: unknown,
): Promise<ActionResult> {
  let actor;

  try {
    actor = await requirePermission("question:create");
  } catch (err) {
    if (err instanceof AuthError) return { ok: false, error: err.message };
    throw err;
  }

  const olympiad = await db.olympiad.findUnique({
    where: { id: olympiadId },
  });

  if (!olympiad) {
    return { ok: false, error: "Olympiad not found." };
  }

  if (olympiad.status === "published") {
    return {
      ok: false,
      error: "Unpublish the Olympiad before editing questions.",
    };
  }

  const parsed = questionSchema.safeParse(input);

  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Invalid input.",
    };
  }

  const v = parsed.data;
  const order = await db.question.count({
    where: { olympiadId },
  });

  await db.question.create({
    data: {
      olympiadId,
      text: v.text,
      imageUrl: v.imageUrl || null,
      subject: v.subject || null,
      difficulty: v.difficulty,
      marks: v.marks,
      order,
      explanation: v.explanation || null,
      options: {
        create: v.options.map((o, index) => ({
          text: o.text,
          isCorrect: o.isCorrect,
          order: index,
        })),
      },
    },
  });

  await recordAudit({
    actorId: actor.id,
    action: "question:created",
    targetType: "olympiad",
    targetId: olympiadId,
  });

  revalidatePath(`/dashboard/olympiads/${olympiadId}`);

  return { ok: true };
}

export async function updateQuestionAction(
  olympiadId: string,
  questionId: string,
  input: unknown,
): Promise<ActionResult> {
  let actor;

  try {
    actor = await requirePermission("question:update");
  } catch (err) {
    if (err instanceof AuthError) return { ok: false, error: err.message };
    throw err;
  }

  const olympiad = await db.olympiad.findUnique({
    where: { id: olympiadId },
  });

  if (!olympiad) {
    return { ok: false, error: "Olympiad not found." };
  }

  if (olympiad.status === "published") {
    return {
      ok: false,
      error: "Unpublish the Olympiad before editing questions.",
    };
  }

  const parsed = questionSchema.safeParse(input);

  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Invalid input.",
    };
  }

  const v = parsed.data;

  await db.question.update({
    where: { id: questionId },
    data: {
      text: v.text,
      imageUrl: v.imageUrl || null,
      subject: v.subject || null,
      difficulty: v.difficulty,
      marks: v.marks,
      explanation: v.explanation || null,
      options: {
        deleteMany: {},
        create: v.options.map((o, index) => ({
          text: o.text,
          isCorrect: o.isCorrect,
          order: index,
        })),
      },
    },
  });

  await recordAudit({
    actorId: actor.id,
    action: "question:updated",
    targetType: "question",
    targetId: questionId,
  });

  revalidatePath(`/dashboard/olympiads/${olympiadId}`);

  return { ok: true };
}

export async function deleteQuestionAction(
  olympiadId: string,
  questionId: string,
): Promise<ActionResult> {
  let actor;

  try {
    actor = await requirePermission("question:delete");
  } catch (err) {
    if (err instanceof AuthError) return { ok: false, error: err.message };
    throw err;
  }

  const olympiad = await db.olympiad.findUnique({
    where: { id: olympiadId },
  });

  if (!olympiad) {
    return { ok: false, error: "Olympiad not found." };
  }

  if (olympiad.status === "published") {
    return {
      ok: false,
      error: "Unpublish the Olympiad before editing questions.",
    };
  }

  await db.question.delete({
    where: { id: questionId },
  });

  await recordAudit({
    actorId: actor.id,
    action: "question:deleted",
    targetType: "question",
    targetId: questionId,
  });

  revalidatePath(`/dashboard/olympiads/${olympiadId}`);

  return { ok: true };
}

/**
 * Publishes results: computes ranks across all submitted attempts and
 * locks their scores. Once locked, an attempt's score is immutable —
 * this action itself is idempotent (safe to re-run, e.g. to add
 * late-graded attempts) but never un-does an existing lock silently;
 * it recomputes and re-locks explicitly.
 */
export async function publishResultsAction(
  olympiadId: string,
): Promise<ActionResult> {
  let actor;

  try {
    actor = await requirePermission("olympiad:results:view");
  } catch (err) {
    if (err instanceof AuthError) return { ok: false, error: err.message };
    throw err;
  }

  const olympiad = await db.olympiad.findUnique({
    where: { id: olympiadId },
  });

  if (!olympiad) {
    return { ok: false, error: "Olympiad not found." };
  }

  const submitted: {
    id: string;
    userId: string;
    score: number | null;
  }[] = await db.attempt.findMany({
    where: { olympiadId, status: "submitted" },
    orderBy: { score: "desc" },
  });

  const autoSubmitted: {
    id: string;
    userId: string;
    score: number | null;
  }[] = await db.attempt.findMany({
    where: { olympiadId, status: "expired_auto_submitted" },
    orderBy: { score: "desc" },
  });

  const ranked = [...submitted, ...autoSubmitted].sort(
    (a, b) => (b.score ?? 0) - (a.score ?? 0),
  );

  for (let i = 0; i < ranked.length; i++) {
    await db.attempt.update({
      where: { id: ranked[i].id },
      data: {
        rank: i + 1,
        scoreLocked: true,
      },
    });
  }

  await db.olympiad.update({
    where: { id: olympiadId },
    data: { resultsPublishedAt: new Date() },
  });

  await recordAudit({
    actorId: actor.id,
    action: "olympiad:results_published",
    targetType: "olympiad",
    targetId: olympiadId,
    metadata: { attemptCount: ranked.length },
  });

  await Promise.all(
    ranked.map((r) =>
      notify({
        userId: r.userId,
        type: "olympiad:results_published",
        title: "Results published",
        body: olympiad.title,
        metadata: { olympiadId },
      }),
    ),
  );

  revalidatePath(`/dashboard/olympiads/${olympiadId}`);
  revalidatePath("/dashboard/results");

  return { ok: true };
}
