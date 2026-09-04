import { z } from "zod";

export const olympiadSchema = z.object({
  title: z.string().trim().min(3, "Title is required."),
  description: z.string().trim().max(2000).optional().or(z.literal("")),
  subject: z.string().trim().max(120).optional().or(z.literal("")),
  durationMinutes: z.number().int().min(5, "Minimum 5 minutes.").max(600),
  startAt: z.string().optional().or(z.literal("")),
  endAt: z.string().optional().or(z.literal("")),
  negativeMarkingEnabled: z.boolean().optional(),
  negativeMarkingValue: z.number().min(0).max(10).optional(),
});

export const optionSchema = z.object({
  text: z.string().trim().min(1, "Option text is required."),
  isCorrect: z.boolean(),
});

export const questionSchema = z.object({
  text: z.string().trim().min(3, "Question text is required."),
  imageUrl: z.string().trim().url().optional().or(z.literal("")),
  subject: z.string().trim().max(120).optional().or(z.literal("")),
  difficulty: z.enum(["easy", "medium", "hard"]),
  marks: z.number().min(0.25).max(100),
  explanation: z.string().trim().max(2000).optional().or(z.literal("")),
  options: z
    .array(optionSchema)
    .min(2, "At least two options are required.")
    .max(8, "At most eight options.")
    .refine((opts) => opts.filter((o) => o.isCorrect).length === 1, {
      message: "Exactly one option must be marked correct.",
    }),
});
