"use server";

import { requirePermission } from "@/lib/authz/guards";
import { translateEnglishToBangla } from "@/lib/question-archive/translation";

export async function translateQuestionArchiveAction(input: {
  questionEn: string;
  options?: string[];
  explanationEn?: string;
}) {
  await requirePermission("question:create");

  try {
    const questionBn = await translateEnglishToBangla(input.questionEn);

    const optionTranslations = await Promise.all(
      (input.options ?? []).map((option) =>
        translateEnglishToBangla(option),
      ),
    );

    const explanationBn = input.explanationEn
      ? await translateEnglishToBangla(input.explanationEn)
      : "";

    return {
      success: true,
      data: {
        questionBn,
        optionsBn: optionTranslations,
        explanationBn,
      },
    };
  } catch (error) {
    console.error("Question archive translation failed:", error);

    return {
      success: false,
      error:
        "Automatic translation is temporarily unavailable. Please try again.",
    };
  }
}
