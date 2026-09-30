"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db/client";
import { requirePermission, AuthError } from "@/lib/authz/guards";
import { recordAudit } from "@/lib/audit";
import { notify } from "@/lib/notifications";
import { getUsersWithPermission } from "@/lib/authz/resolve-users";
import { olympiadSchema, questionSchema } from "./validation";
import { finalizeOlympiadResults, isOlympiadFinished } from "./results";
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
      posterUrl: v.posterUrl || null,
      subject: v.subject || null,
      durationMinutes: v.durationMinutes,

      registrationType: v.registrationType,
      registrationFee:
        v.registrationType === "paid" ? (v.registrationFee ?? null) : null,

      registrationStartAt: new Date(v.registrationStartAt),
      registrationEndAt: new Date(v.registrationEndAt),
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
      posterUrl: v.posterUrl || null,
      subject: v.subject || null,
      durationMinutes: v.durationMinutes,

      registrationType: v.registrationType,
      registrationFee:
        v.registrationType === "paid" ? (v.registrationFee ?? null) : null,

      registrationStartAt: new Date(v.registrationStartAt),
      registrationEndAt: new Date(v.registrationEndAt),
      startAt: v.startAt ? new Date(v.startAt) : null,
      endAt: v.endAt ? new Date(v.endAt) : null,

      negativeMarkingEnabled: v.negativeMarkingEnabled ?? false,
      negativeMarkingValue: v.negativeMarkingValue ?? 0,

      eligibilityMode: v.eligibilityMode ?? "open",
      eligibilityGradeLevel: v.eligibilityGradeLevel || null,
      eligibilityInstitution: v.eligibilityInstitution || null,
      eligibilityAcademicLevel: v.eligibilityAcademicLevel || null,
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

export async function setOlympiadRegistrationAction(
  id: string,
  enabled: boolean,
): Promise<ActionResult> {
  let actor;

  try {
    actor = await requirePermission("olympiad:schedule");
  } catch (err) {
    if (err instanceof AuthError) return { ok: false, error: err.message };
    throw err;
  }

  const olympiad = await db.olympiad.findUnique({ where: { id } });

  if (!olympiad) {
    return { ok: false, error: "Olympiad not found." };
  }

  await db.olympiad.update({
    where: { id },
    data: { registrationEnabled: enabled },
  });

  await recordAudit({
    actorId: actor.id,
    action: enabled
      ? "olympiad:registration_opened"
      : "olympiad:registration_closed",
    targetType: "olympiad",
    targetId: id,
  });

  revalidatePath(`/dashboard/olympiads/${id}`);
  revalidatePath(`/olympiads/${id}`);
  revalidatePath("/olympiads");

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

export async function importArchivedQuestionsAction(
  olympiadId: string,
  archiveQuestionIds: string[],
): Promise<ActionResult<{ imported: number; skipped: number }>> {
  let actor;

  try {
    actor = await requirePermission("question:create");
  } catch (err) {
    if (err instanceof AuthError) return { ok: false, error: err.message };
    throw err;
  }

  const olympiad = await db.olympiad.findUnique({ where: { id: olympiadId } });
  if (!olympiad) return { ok: false, error: "Olympiad not found." };

  const ids = [...new Set(archiveQuestionIds.filter(Boolean))];
  if (ids.length === 0) return { ok: false, error: "Select at least one archived question." };

  const archived = await db.questionArchive.findMany({
    where: { id: { in: ids } },
    include: { options: { orderBy: { order: "asc" } } },
  });

  if (archived.length === 0) return { ok: false, error: "No archived questions were found." };

  const existing = await db.question.findMany({
    where: { olympiadId, archiveQuestionId: { in: ids } },
    select: { archiveQuestionId: true },
  });
  const existingIds = new Set(existing.map((q) => q.archiveQuestionId).filter(Boolean) as string[]);
  const toImport = archived.filter((q) => !existingIds.has(q.id));
  const skipped = archived.length - toImport.length;

  let nextOrder = await db.question.count({ where: { olympiadId } });

  await db.$transaction(async (tx) => {
    for (const archiveQuestion of toImport) {
      await tx.question.create({
        data: {
          olympiadId,
          archiveQuestionId: archiveQuestion.id,
          type: archiveQuestion.type,
          text: archiveQuestion.questionEn,
          textBn: archiveQuestion.questionBn,
          imageUrl: archiveQuestion.imageUrl,
          subject: null,
          difficulty: archiveQuestion.difficulty,
          marks: archiveQuestion.marks,
          order: nextOrder++,
          explanation: archiveQuestion.explanationEn,
          explanationBn: archiveQuestion.explanationBn,
          options:
            archiveQuestion.type === "mcq"
              ? {
                  create: archiveQuestion.options.map((option, index) => ({
                    text: option.textEn,
                    textBn: option.textBn,
                    isCorrect: option.isCorrect,
                    order: index,
                  })),
                }
              : undefined,
        },
      });
    }
  });

  await recordAudit({
    actorId: actor.id,
    action: "question:imported_from_archive",
    targetType: "olympiad",
    targetId: olympiadId,
    metadata: { archiveQuestionIds: toImport.map((q) => q.id), imported: toImport.length, skipped },
  });

  revalidatePath(`/dashboard/olympiads/${olympiadId}`);
  return { ok: true, data: { imported: toImport.length, skipped } };
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

  if (olympiad.resultsPublishedAt) {
    return { ok: false, error: "Results are already published." };
  }

  if (!isOlympiadFinished(olympiad.endAt)) {
    return {
      ok: false,
      error: "Results can only be published after the Olympiad has finished.",
    };
  }

  const finalized = await finalizeOlympiadResults(olympiadId);

  if (!finalized.finalized) {
    return { ok: false, error: "The Olympiad is not ready for final results." };
  }

  const published = await db.olympiad.updateMany({
    where: { id: olympiadId, resultsPublishedAt: null },
    data: { resultsPublishedAt: new Date() },
  });

  if (published.count !== 1) {
    return { ok: false, error: "Results could not be published because the publication state changed." };
  }

  const ranked = await db.attempt.findMany({
    where: {
      olympiadId,
      rank: { not: null },
    },
    select: { userId: true },
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
  revalidatePath(`/dashboard/results/${olympiadId}`);
  revalidatePath("/dashboard/results");

  return { ok: true };
}
