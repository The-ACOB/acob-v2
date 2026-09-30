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

  return {
    ok: true,
    data: { id: olympiad.id },
  };
}

export async function updateOlympiadAction(
  id: string,
  input: unknown,
): Promise<ActionResult> {
  let actor;

  try {
    actor = await requirePermission("olympiad:update");
  } catch (err) {
    if (err instanceof AuthError) {
      return {
        ok: false,
        error: err.message,
      };
    }

    throw err;
  }

  const olympiad = await db.olympiad.findUnique({
    where: { id },
  });

  if (!olympiad) {
    return {
      ok: false,
      error: "Olympiad not found.",
    };
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

  return {
    ok: true,
  };
}

export async function publishOlympiadAction(
  id: string,
  publishAt?: string,
): Promise<ActionResult> {
  let actor;

  try {
    actor = await requirePermission("olympiad:publish");
  } catch (err) {
    if (err instanceof AuthError) {
      return {
        ok: false,
        error: err.message,
      };
    }

    throw err;
  }

  const olympiad = await db.olympiad.findUnique({
    where: { id },
  });

  if (!olympiad) {
    return {
      ok: false,
      error: "Olympiad not found.",
    };
  }

  const scheduled = publishAt ? new Date(publishAt) : null;

  const isFuture = scheduled && scheduled.getTime() > Date.now();

  await db.olympiad.update({
    where: { id },
    data: isFuture
      ? {
          status: "draft",
          publishAt: scheduled,
        }
      : {
          status: "published",
          publishAt: new Date(),
        },
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
          metadata: {
            olympiadId: id,
          },
        }),
      ),
    );
  }

  revalidatePath(`/dashboard/olympiads/${id}`);

  revalidatePath("/dashboard/olympiads");

  return {
    ok: true,
  };
}

export async function unpublishOlympiadAction(
  id: string,
): Promise<ActionResult> {
  let actor;

  try {
    actor = await requirePermission("olympiad:publish");
  } catch (err) {
    if (err instanceof AuthError) {
      return {
        ok: false,
        error: err.message,
      };
    }

    throw err;
  }

  await db.olympiad.update({
    where: { id },
    data: {
      status: "unpublished",
    },
  });

  await recordAudit({
    actorId: actor.id,
    action: "olympiad:unpublished",
    targetType: "olympiad",
    targetId: id,
  });

  revalidatePath(`/dashboard/olympiads/${id}`);

  revalidatePath("/dashboard/olympiads");

  return {
    ok: true,
  };
}

export async function setOlympiadRegistrationAction(
  id: string,
  enabled: boolean,
): Promise<ActionResult> {
  let actor;

  try {
    actor = await requirePermission("olympiad:schedule");
  } catch (err) {
    if (err instanceof AuthError) {
      return {
        ok: false,
        error: err.message,
      };
    }

    throw err;
  }

  const olympiad = await db.olympiad.findUnique({
    where: { id },
  });

  if (!olympiad) {
    return {
      ok: false,
      error: "Olympiad not found.",
    };
  }

  await db.olympiad.update({
    where: { id },
    data: {
      registrationEnabled: enabled,
    },
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

  return {
    ok: true,
  };
}

export async function createQuestionAction(
  olympiadId: string,
  input: unknown,
): Promise<ActionResult> {
  let actor;

  try {
    actor = await requirePermission("question:create");
  } catch (err) {
    if (err instanceof AuthError) {
      return {
        ok: false,
        error: err.message,
      };
    }

    throw err;
  }

  const olympiad = await db.olympiad.findUnique({
    where: { id: olympiadId },
  });

  if (!olympiad) {
    return {
      ok: false,
      error: "Olympiad not found.",
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

  return {
    ok: true,
  };
}

export async function importArchivedQuestionsAction(
  olympiadId: string,
  archiveQuestionIds: string[],
): Promise<
  ActionResult<{
    imported: number;
    skipped: number;
  }>
> {
  let actor;

  try {
    actor = await requirePermission("question:create");
  } catch (err) {
    if (err instanceof AuthError) {
      return {
        ok: false,
        error: err.message,
      };
    }

    throw err;
  }

  const olympiad = await db.olympiad.findUnique({
    where: { id: olympiadId },
  });

  if (!olympiad) {
    return {
      ok: false,
      error: "Olympiad not found.",
    };
  }

  const ids = [...new Set(archiveQuestionIds.filter(Boolean))];

  if (ids.length === 0) {
    return {
      ok: false,
      error: "Select at least one archived question.",
    };
  }

  const archived = await db.questionArchive.findMany({
    where: {
      id: {
        in: ids,
      },
    },
    include: {
      options: {
        orderBy: {
          order: "asc",
        },
      },
    },
  });

  if (archived.length === 0) {
    return {
      ok: false,
      error: "No archived questions were found.",
    };
  }

  const existing = await db.question.findMany({
    where: {
      olympiadId,
      archiveQuestionId: {
        in: ids,
      },
    },
    select: {
      archiveQuestionId: true,
    },
  });

  const existingIds = new Set(
    existing.map((q) => q.archiveQuestionId).filter(Boolean) as string[],
  );

  const toImport = archived.filter((q) => !existingIds.has(q.id));

  const skipped = archived.length - toImport.length;

  let nextOrder = await db.question.count({
    where: { olympiadId },
  });

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
    metadata: {
      archiveQuestionIds: toImport.map((q) => q.id),
      imported: toImport.length,
      skipped,
    },
  });

  revalidatePath(`/dashboard/olympiads/${olympiadId}`);

  return {
    ok: true,
    data: {
      imported: toImport.length,
      skipped,
    },
  };
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
    if (err instanceof AuthError) {
      return {
        ok: false,
        error: err.message,
      };
    }

    throw err;
  }

  const olympiad = await db.olympiad.findUnique({
    where: { id: olympiadId },
  });

  if (!olympiad) {
    return {
      ok: false,
      error: "Olympiad not found.",
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
    where: {
      id: questionId,
    },

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

  return {
    ok: true,
  };
}

export async function deleteQuestionAction(
  olympiadId: string,
  questionId: string,
): Promise<ActionResult> {
  let actor;

  try {
    actor = await requirePermission("question:delete");
  } catch (err) {
    if (err instanceof AuthError) {
      return {
        ok: false,
        error: err.message,
      };
    }

    throw err;
  }

  const olympiad = await db.olympiad.findUnique({
    where: { id: olympiadId },
  });

  if (!olympiad) {
    return {
      ok: false,
      error: "Olympiad not found.",
    };
  }

  await db.question.delete({
    where: {
      id: questionId,
    },
  });

  await recordAudit({
    actorId: actor.id,
    action: "question:deleted",
    targetType: "question",
    targetId: questionId,
  });

  revalidatePath(`/dashboard/olympiads/${olympiadId}`);

  return {
    ok: true,
  };
}

/* =========================================================
   MANUAL RESULT RANKING
   ========================================================= */

export async function saveManualRankingAction(
  olympiadId: string,
  orderedAttemptIds: string[],
): Promise<ActionResult> {
  let actor;

  try {
    actor = await requirePermission("olympiad:results:view");
  } catch (err) {
    if (err instanceof AuthError) {
      return {
        ok: false,
        error: err.message,
      };
    }

    throw err;
  }

  const olympiad = await db.olympiad.findUnique({
    where: {
      id: olympiadId,
    },
  });

  if (!olympiad) {
    return {
      ok: false,
      error: "Olympiad not found.",
    };
  }

  const attempts = await db.attempt.findMany({
    where: {
      olympiadId,

      status: {
        in: ["submitted", "expired_auto_submitted"],
      },
    },

    select: {
      id: true,
      score: true,
    },
  });

  const eligibleIds = new Set(attempts.map((attempt) => attempt.id));

  /*
   * Every eligible submitted attempt must
   * appear exactly once in the final order.
   */
  if (orderedAttemptIds.length !== attempts.length) {
    return {
      ok: false,
      error: "The ranking list is out of date. Refresh and try again.",
    };
  }

  if (
    new Set(orderedAttemptIds).size !== orderedAttemptIds.length ||
    orderedAttemptIds.some((id) => !eligibleIds.has(id))
  ) {
    return {
      ok: false,
      error: "Invalid ranking order.",
    };
  }

  /*
   * manualRank = the administrator's chosen
   * position.
   *
   * rank = the actual final/published position.
   *
   * This means the published results immediately
   * reflect the manual change, even if results
   * were already published.
   */
  await db.$transaction(
    orderedAttemptIds.map((attemptId, index) =>
      db.attempt.update({
        where: {
          id: attemptId,
        },

        data: {
          manualRank: index + 1,

          rank: index + 1,
        },
      }),
    ),
  );

  await recordAudit({
    actorId: actor.id,

    action: "olympiad:results_ranking_overridden",

    targetType: "olympiad",

    targetId: olympiadId,

    metadata: {
      published: Boolean(olympiad.resultsPublishedAt),

      attemptCount: orderedAttemptIds.length,

      orderedAttemptIds,
    },
  });

  /*
   * IMPORTANT:
   * Revalidate BOTH the management page
   * and the actual results page.
   */
  revalidatePath(`/dashboard/olympiads/${olympiadId}`);

  revalidatePath(`/dashboard/results/${olympiadId}`);

  revalidatePath("/dashboard/results");

  return {
    ok: true,
  };
}

export async function resetManualRankingAction(
  olympiadId: string,
): Promise<ActionResult> {
  let actor;

  try {
    actor = await requirePermission("olympiad:results:view");
  } catch (err) {
    if (err instanceof AuthError) {
      return {
        ok: false,
        error: err.message,
      };
    }

    throw err;
  }

  const olympiad = await db.olympiad.findUnique({
    where: {
      id: olympiadId,
    },
  });

  if (!olympiad) {
    return {
      ok: false,
      error: "Olympiad not found.",
    };
  }

  /*
   * Restore pure automatic ranking:
   * highest score first.
   */
  const attempts = await db.attempt.findMany({
    where: {
      olympiadId,

      status: {
        in: ["submitted", "expired_auto_submitted"],
      },
    },

    select: {
      id: true,
      score: true,
    },

    orderBy: {
      score: "desc",
    },
  });

  await db.$transaction(
    attempts.map((attempt, index) =>
      db.attempt.update({
        where: {
          id: attempt.id,
        },

        data: {
          rank: index + 1,

          manualRank: null,
        },
      }),
    ),
  );

  await recordAudit({
    actorId: actor.id,

    action: "olympiad:results_ranking_reset",

    targetType: "olympiad",

    targetId: olympiadId,

    metadata: {
      attemptCount: attempts.length,
    },
  });

  revalidatePath(`/dashboard/olympiads/${olympiadId}`);

  revalidatePath(`/dashboard/results/${olympiadId}`);

  revalidatePath("/dashboard/results");

  return {
    ok: true,
  };
}

/* =========================================================
   PUBLISH RESULTS
   ========================================================= */

export async function publishResultsAction(
  olympiadId: string,
): Promise<ActionResult> {
  let actor;

  try {
    actor = await requirePermission("olympiad:results:view");
  } catch (err) {
    if (err instanceof AuthError) {
      return {
        ok: false,
        error: err.message,
      };
    }

    throw err;
  }

  const olympiad = await db.olympiad.findUnique({
    where: {
      id: olympiadId,
    },
  });

  if (!olympiad) {
    return {
      ok: false,
      error: "Olympiad not found.",
    };
  }

  /*
   * Get every eligible attempt.
   *
   * We intentionally include both normal submitted
   * and expired auto-submitted attempts.
   */
  const attempts = await db.attempt.findMany({
    where: {
      olympiadId,

      status: {
        in: ["submitted", "expired_auto_submitted"],
      },
    },

    select: {
      id: true,
      userId: true,
      score: true,
      manualRank: true,
    },
  });

  /*
   * Automatic ranking.
   */
  const automaticOrder = [...attempts].sort(
    (a, b) => (b.score ?? 0) - (a.score ?? 0),
  );

  /*
   * Determine whether an administrator has
   * manually ranked EVERY eligible attempt.
   */
  const hasCompleteManualRanking =
    attempts.length > 0 &&
    attempts.every((attempt) => attempt.manualRank !== null);

  /*
   * If manual ranking is complete, it becomes
   * authoritative.
   *
   * Otherwise use automatic score ranking.
   */
  const ranked = hasCompleteManualRanking
    ? [...automaticOrder].sort(
        (a, b) => (a.manualRank ?? 0) - (b.manualRank ?? 0),
      )
    : automaticOrder;

  /*
   * Persist the FINAL ranking.
   */
  await db.$transaction(
    ranked.map((attempt, index) =>
      db.attempt.update({
        where: {
          id: attempt.id,
        },

        data: {
          rank: index + 1,

          scoreLocked: true,
        },
      }),
    ),
  );

  await db.olympiad.update({
    where: {
      id: olympiadId,
    },

    data: {
      resultsPublishedAt: new Date(),
    },
  });

  await recordAudit({
    actorId: actor.id,

    action: "olympiad:results_published",

    targetType: "olympiad",

    targetId: olympiadId,

    metadata: {
      attemptCount: ranked.length,

      usedManualRanking: hasCompleteManualRanking,
    },
  });

  /*
   * Notify participants.
   */
  await Promise.all(
    ranked.map((attempt) =>
      notify({
        userId: attempt.userId,

        type: "olympiad:results_published",

        title: "Results published",

        body: olympiad.title,

        metadata: {
          olympiadId,
        },
      }),
    ),
  );

  /*
   * IMPORTANT:
   * Invalidate every results surface.
   */
  revalidatePath(`/dashboard/olympiads/${olympiadId}`);

  revalidatePath(`/dashboard/results/${olympiadId}`);

  revalidatePath("/dashboard/results");

  return {
    ok: true,
  };
}
