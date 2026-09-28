"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db/client";
import { requirePermission } from "@/lib/authz/guards";
import { recordAudit } from "@/lib/audit";

export async function createQuestionArchiveSubjectAction(name: string) {
  const user = await requirePermission("question:create");

  const cleanName = name.trim();

  if (!cleanName) {
    return { success: false, error: "Subject name is required." };
  }

  if (cleanName.length > 100) {
    return { success: false, error: "Subject name is too long." };
  }

  try {
    const subject = await db.questionArchiveSubject.create({
      data: {
        name: cleanName,
      },
    });

    await recordAudit({
      actorId: user.id,
      action: "question_archive_subject.create",
      targetType: "QuestionArchiveSubject",
      targetId: subject.id,
      metadata: {
        name: subject.name,
        createdBy: user.id,
      },
    });

    revalidatePath("/dashboard/question-archive");

    return {
      success: true,
      data: subject,
    };
  } catch (error) {
    console.error("Failed to create archive subject:", error);

    return {
      success: false,
      error: "A subject with this name may already exist.",
    };
  }
}

export async function deleteQuestionArchiveSubjectAction(id: string) {
  await requirePermission("question:delete");

  if (!id) {
    return {
      success: false,
      error: "Subject ID is required.",
    };
  }

  try {
    await db.questionArchiveSubject.delete({
      where: { id },
    });

    await recordAudit({
      actorId: null,
      action: "question_archive_subject.delete",
      targetType: "QuestionArchiveSubject",
      targetId: id,
    });

    revalidatePath("/dashboard/question-archive");

    return { success: true };
  } catch (error) {
    console.error("Failed to delete archive subject:", error);

    return {
      success: false,
      error:
        "This subject could not be deleted. Make sure it is not being used by archived questions.",
    };
  }
}

