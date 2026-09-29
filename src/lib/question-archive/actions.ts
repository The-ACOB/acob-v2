"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db/client";
import { requirePermission } from "@/lib/authz/guards";
import { recordAudit } from "@/lib/audit";
import { questionArchiveSchema } from "@/lib/question-archive-validation";

export async function createQuestionArchiveAction(input: unknown) {
  const user = await requirePermission("question:create");
  const parsed = questionArchiveSchema.safeParse(input);

  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "Invalid question data.",
    };
  }

  const data = parsed.data;

  if (data.folderId) {
    const folder = await db.questionArchiveFolder.findUnique({ where: { id: data.folderId } });
    if (!folder || folder.subjectId !== data.subjectId) {
      return { success: false, error: "The selected archive folder is invalid." };
    }
  }

  try {
    const archiveQuestion = await db.questionArchive.create({
      data: {
        type: data.type,
        questionEn: data.questionEn,
        questionBn: data.questionBn,
        subjectId: data.subjectId,
        folderId: data.folderId || null,
        difficulty: data.difficulty,
        marks: data.marks,
        explanationEn: data.explanationEn || null,
        explanationBn: data.explanationBn || null,
        imageUrl: data.imageUrl || null,
        createdBy: user.id,
        options:
          data.type === "mcq"
            ? {
                create: data.options.map((option, index) => ({
                  label: option.label,
                  textEn: option.textEn,
                  textBn: option.textBn,
                  isCorrect: option.isCorrect,
                  order: index,
                })),
              }
            : undefined,
      },
      include: {
        options: {
          orderBy: { order: "asc" },
        },
      },
    });

    await recordAudit({
      actorId: user.id,
      action: "question_archive.create",
      targetType: "QuestionArchive",
      targetId: archiveQuestion.id,
      metadata: {
        type: archiveQuestion.type,
        subjectId: archiveQuestion.subjectId,
      },
    });

    revalidatePath("/dashboard/question-archive");

    return {
      success: true,
      data: archiveQuestion,
    };
  } catch (error) {
    console.error("Failed to create archived question:", error);

    return {
      success: false,
      error: "Failed to save the question to the archive.",
    };
  }
}


export async function updateQuestionArchiveAction(id: string, input: unknown) {
  const user = await requirePermission("question:create");

  if (!id) {
    return {
      success: false,
      error: "Question ID is required.",
    };
  }

  const parsed = questionArchiveSchema.safeParse(input);

  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "Invalid question data.",
    };
  }

  const data = parsed.data;

  if (data.folderId) {
    const folder = await db.questionArchiveFolder.findUnique({ where: { id: data.folderId } });
    if (!folder || folder.subjectId !== data.subjectId) {
      return { success: false, error: "The selected archive folder is invalid." };
    }
  }

  try {
    const existing = await db.questionArchive.findUnique({
      where: { id },
    });

    if (!existing) {
      return {
        success: false,
        error: "Archived question not found.",
      };
    }

    const archiveQuestion = await db.$transaction(async (tx) => {
      await tx.questionArchiveOption.deleteMany({
        where: { archiveQuestionId: id },
      });

      return tx.questionArchive.update({
        where: { id },
        data: {
          type: data.type,
          questionEn: data.questionEn,
          questionBn: data.questionBn,
          subjectId: data.subjectId,
          folderId: data.folderId || null,
          difficulty: data.difficulty,
          marks: data.marks,
          explanationEn: data.explanationEn || null,
          explanationBn: data.explanationBn || null,
          imageUrl: data.imageUrl || null,
          options:
            data.type === "mcq"
              ? {
                  create: data.options.map((option, index) => ({
                    label: option.label,
                    textEn: option.textEn,
                    textBn: option.textBn,
                    isCorrect: option.isCorrect,
                    order: index,
                  })),
                }
              : undefined,
        },
        include: {
          options: {
            orderBy: { order: "asc" },
          },
        },
      });
    });

    await recordAudit({
      actorId: user.id,
      action: "question_archive.update",
      targetType: "QuestionArchive",
      targetId: id,
      metadata: {
        type: archiveQuestion.type,
        subjectId: archiveQuestion.subjectId,
      },
    });

    revalidatePath("/dashboard/question-archive");
    revalidatePath("/dashboard/question-archive/" + data.subjectId);

    return {
      success: true,
      data: archiveQuestion,
    };
  } catch (error) {
    console.error("Failed to update archived question:", error);

    return {
      success: false,
      error: "Failed to update the archived question.",
    };
  }
}

export async function deleteQuestionArchiveAction(id: string) {
  await requirePermission("question:delete");

  if (!id) {
    return {
      success: false,
      error: "Question ID is required.",
    };
  }

  try {
    await db.questionArchive.delete({
      where: { id },
    });

    await recordAudit({
      actorId: null,
      action: "question_archive.delete",
      targetType: "QuestionArchive",
      targetId: id,
    });

    revalidatePath("/dashboard/question-archive");

    return {
      success: true,
    };
  } catch (error) {
    console.error("Failed to delete archived question:", error);

    return {
      success: false,
      error: "Failed to delete the archived question.",
    };
  }
}

