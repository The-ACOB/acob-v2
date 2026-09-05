import { z } from "zod";

export const olympiadSchema = z
  .object({
    title: z.string().trim().min(3, "Title is required."),
    description: z.string().trim().max(2000).optional().or(z.literal("")),
    subject: z.string().trim().max(120).optional().or(z.literal("")),
    durationMinutes: z.number().int().min(5, "Minimum 5 minutes.").max(600),
    registrationStartAt: z.string().min(1, "Registration opening is required."),
    registrationEndAt: z.string().min(1, "Registration closing is required."),
    startAt: z.string().optional().or(z.literal("")),
    endAt: z.string().optional().or(z.literal("")),
    negativeMarkingEnabled: z.boolean().optional(),
    negativeMarkingValue: z.number().min(0).max(10).optional(),
    eligibilityMode: z.enum(["open", "criteria"]).optional(),
    eligibilityGradeLevel: z
      .string()
      .trim()
      .max(50)
      .optional()
      .or(z.literal("")),
    eligibilityInstitution: z
      .string()
      .trim()
      .max(200)
      .optional()
      .or(z.literal("")),
    eligibilityAcademicLevel: z
      .string()
      .trim()
      .max(100)
      .optional()
      .or(z.literal("")),
  })
  .superRefine((value, ctx) => {
    const registrationStart = new Date(value.registrationStartAt);
    const registrationEnd = new Date(value.registrationEndAt);
    const examStart = value.startAt ? new Date(value.startAt) : null;
    const examEnd = value.endAt ? new Date(value.endAt) : null;

    if (
      Number.isNaN(registrationStart.getTime()) ||
      Number.isNaN(registrationEnd.getTime())
    ) {
      ctx.addIssue({
        code: "custom",
        path: ["registrationStartAt"],
        message: "Enter valid registration dates.",
      });
    } else if (registrationStart >= registrationEnd) {
      ctx.addIssue({
        code: "custom",
        path: ["registrationEndAt"],
        message: "Registration must close after it opens.",
      });
    }
    if (!examStart || Number.isNaN(examStart.getTime())) {
      ctx.addIssue({
        code: "custom",
        path: ["startAt"],
        message: "Exam start is required.",
      });
    }
    if (!examEnd || Number.isNaN(examEnd.getTime())) {
      ctx.addIssue({
        code: "custom",
        path: ["endAt"],
        message: "Exam end is required.",
      });
    }
    if (
      examStart &&
      examEnd &&
      !Number.isNaN(examStart.getTime()) &&
      !Number.isNaN(examEnd.getTime())
    ) {
      if (registrationEnd > examStart) {
        ctx.addIssue({
          code: "custom",
          path: ["registrationEndAt"],
          message: "Registration must close before the exam starts.",
        });
      }
      if (examStart >= examEnd) {
        ctx.addIssue({
          code: "custom",
          path: ["endAt"],
          message: "Exam must end after it starts.",
        });
      }
    }
    if (
      value.negativeMarkingEnabled &&
      (value.negativeMarkingValue ?? 0) <= 0
    ) {
      ctx.addIssue({
        code: "custom",
        path: ["negativeMarkingValue"],
        message:
          "Enter a penalty greater than zero when negative marking is enabled.",
      });
    }
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
