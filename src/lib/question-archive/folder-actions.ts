"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db/client";
import { requirePermission } from "@/lib/authz/guards";
import { recordAudit } from "@/lib/audit";

export async function createQuestionArchiveFolderAction(input: {
  subjectId: string;
  parentId?: string | null;
  name: string;
}) {
  const user = await requirePermission("question:create");
  const name = input.name.trim();

  if (!input.subjectId) return { success: false, error: "Subject is required." };
  if (!name) return { success: false, error: "Folder name is required." };
  if (name.length > 100) return { success: false, error: "Folder name is too long." };

  try {
    const subject = await db.questionArchiveSubject.findUnique({ where: { id: input.subjectId } });
    if (!subject) return { success: false, error: "Subject not found." };

    if (input.parentId) {
      const parent = await db.questionArchiveFolder.findUnique({ where: { id: input.parentId } });
      if (!parent || parent.subjectId !== input.subjectId) {
        return { success: false, error: "Parent folder not found." };
      }
    }

    const duplicate = await db.questionArchiveFolder.findFirst({
      where: {
        subjectId: input.subjectId,
        parentId: input.parentId || null,
        name,
      },
    });
    if (duplicate) return { success: false, error: "A folder with this name already exists here." };

    const folder = await db.questionArchiveFolder.create({
      data: {
        subjectId: input.subjectId,
        parentId: input.parentId || null,
        name,
        createdBy: user.id,
      },
    });

    await recordAudit({
      actorId: user.id,
      action: "question_archive_folder.create",
      targetType: "QuestionArchiveFolder",
      targetId: folder.id,
      metadata: { subjectId: input.subjectId, parentId: input.parentId || null, name },
    });

    revalidatePath(`/dashboard/question-archive/${input.subjectId}`);
    revalidatePath("/dashboard/question-archive");

    return { success: true, data: folder };
  } catch (error) {
    console.error("Failed to create archive folder:", error);
    return { success: false, error: "A folder with this name already exists here." };
  }
}

export async function renameQuestionArchiveFolderAction(id: string, name: string) {
  const user = await requirePermission("question:create");
  const cleanName = name.trim();
  if (!cleanName) return { success: false, error: "Folder name is required." };

  try {
    const existing = await db.questionArchiveFolder.findUnique({ where: { id } });
    if (!existing) return { success: false, error: "Folder not found." };

    const duplicate = await db.questionArchiveFolder.findFirst({
      where: { subjectId: existing.subjectId, parentId: existing.parentId, name: cleanName, NOT: { id } },
    });
    if (duplicate) return { success: false, error: "A folder with this name already exists here." };

    const folder = await db.questionArchiveFolder.update({ where: { id }, data: { name: cleanName } });
    await recordAudit({
      actorId: user.id,
      action: "question_archive_folder.rename",
      targetType: "QuestionArchiveFolder",
      targetId: id,
      metadata: { subjectId: folder.subjectId, name: cleanName },
    });
    revalidatePath(`/dashboard/question-archive/${folder.subjectId}`);
    return { success: true, data: folder };
  } catch (error) {
    console.error("Failed to rename archive folder:", error);
    return { success: false, error: "A folder with this name already exists here." };
  }
}

export async function deleteQuestionArchiveFolderAction(id: string) {
  const user = await requirePermission("question:delete");

  try {
    const folder = await db.questionArchiveFolder.findUnique({
      where: { id },
      include: { _count: { select: { children: true, questions: true } } },
    });
    if (!folder) return { success: false, error: "Folder not found." };

    if (folder._count.children > 0 || folder._count.questions > 0) {
      return { success: false, error: "Empty the folder before deleting it." };
    }

    await db.questionArchiveFolder.delete({ where: { id } });
    await recordAudit({
      actorId: user.id,
      action: "question_archive_folder.delete",
      targetType: "QuestionArchiveFolder",
      targetId: id,
      metadata: { subjectId: folder.subjectId, name: folder.name },
    });
    revalidatePath(`/dashboard/question-archive/${folder.subjectId}`);
    return { success: true };
  } catch (error) {
    console.error("Failed to delete archive folder:", error);
    return { success: false, error: "Failed to delete the folder." };
  }
}


export async function moveQuestionArchiveQuestionsAction(
  questionIds: string[],
  destinationFolderId: string | null,
) {
  const user = await requirePermission("question:update");

  const ids = Array.from(new Set(questionIds.filter(Boolean)));
  if (ids.length === 0) {
    return { success: false, error: "Select at least one question." };
  }

  try {
    const questions = await db.questionArchive.findMany({
      where: { id: { in: ids } },
      select: { id: true, subjectId: true, folderId: true },
    });

    if (questions.length !== ids.length) {
      return { success: false, error: "One or more questions could not be found." };
    }

    const subjectIds = new Set(questions.map((question) => question.subjectId));
    if (subjectIds.size !== 1 || !questions[0]?.subjectId) {
      return { success: false, error: "Questions must belong to the same subject." };
    }

    const subjectId = questions[0].subjectId;

    if (destinationFolderId) {
      const destination = await db.questionArchiveFolder.findUnique({
        where: { id: destinationFolderId },
        select: { id: true, subjectId: true },
      });

      if (!destination || destination.subjectId !== subjectId) {
        return { success: false, error: "Destination folder is invalid." };
      }
    }

    await db.questionArchive.updateMany({
      where: { id: { in: ids } },
      data: { folderId: destinationFolderId },
    });

    await recordAudit({
      actorId: user.id,
      action: "question_archive.move",
      targetType: "QuestionArchive",
      targetId: ids[0],
      metadata: {
        questionIds: ids,
        subjectId,
        destinationFolderId,
      },
    });

    revalidatePath(`/dashboard/question-archive/${subjectId}`);
    revalidatePath("/dashboard/question-archive");

    return { success: true, count: ids.length };
  } catch (error) {
    console.error("Failed to move archive questions:", error);
    return { success: false, error: "Failed to move the selected questions." };
  }
}
