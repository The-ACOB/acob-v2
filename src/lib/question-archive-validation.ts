import { z } from "zod";

const archiveOptionSchema = z.object({
  label: z.enum(["A", "B", "C", "D"]),
  textEn: z.string().trim().min(1, "English option is required."),
  textBn: z.string().trim().min(1, "Bangla option is required."),
  isCorrect: z.boolean(),
});

export const questionArchiveSchema = z
  .object({
    type: z.enum(["mcq", "short"]),
    questionEn: z.string().trim().min(3, "English question is required."),
    questionBn: z.string().trim().min(3, "Bangla question is required."),
    subjectId: z.string().uuid("A valid subject is required."),
    difficulty: z.enum(["easy", "medium", "hard"]),
    marks: z.number().min(0.25).max(100),
    explanationEn: z.string().trim().max(5000).optional().or(z.literal("")),
    explanationBn: z.string().trim().max(5000).optional().or(z.literal("")),
    imageUrl: z.string().trim().url().optional().or(z.literal("")),
    options: z.array(archiveOptionSchema).max(4),
  })
  .superRefine((data, ctx) => {
    if (data.type === "mcq") {
      if (data.options.length !== 4) {
        ctx.addIssue({
          code: "custom",
          path: ["options"],
          message: "MCQ questions must have exactly four options.",
        });
      }

      if (data.options.filter((option) => option.isCorrect).length !== 1) {
        ctx.addIssue({
          code: "custom",
          path: ["options"],
          message: "Exactly one MCQ option must be marked correct.",
        });
      }
    }

    if (data.type === "short" && data.options.length > 0) {
      ctx.addIssue({
        code: "custom",
        path: ["options"],
        message: "Short questions cannot have options.",
      });
    }
  });

export type QuestionArchiveInput = z.infer<typeof questionArchiveSchema>;
