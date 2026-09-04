import { z } from "zod";

export const createLetterSchema = z.object({
  recipientEmail: z.string().trim().toLowerCase().email("Enter a valid email address."),
  title: z.string().trim().min(3).max(200),
  body: z.string().trim().max(5000).optional().or(z.literal("")),
  fileUrl: z.string().trim().url().optional().or(z.literal("")),
});
