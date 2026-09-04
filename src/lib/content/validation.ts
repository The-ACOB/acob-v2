import { z } from "zod";

export const CONTENT_KINDS = ["podcast", "study_guide", "video_tutorial", "resource"] as const;

export const contentSchema = z.object({
  title: z.string().trim().min(3, "Title is required."),
  description: z.string().trim().max(1000).optional().or(z.literal("")),
  body: z.string().trim().max(20000).optional().or(z.literal("")),
  externalUrl: z.string().trim().url().optional().or(z.literal("")),
});
