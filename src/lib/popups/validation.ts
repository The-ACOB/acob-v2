import { z } from "zod";

export const popupSchema = z.object({
  content: z.string().trim().min(3, "Enter the popup message.").max(280, "Keep it short."),
  ctaLabel: z.string().trim().max(60).optional().or(z.literal("")),
  ctaUrl: z.string().trim().url().optional().or(z.literal("")),
  startAt: z.string().optional().or(z.literal("")),
  endAt: z.string().optional().or(z.literal("")),
  priority: z.number().int().min(0).max(100).optional(),
});
