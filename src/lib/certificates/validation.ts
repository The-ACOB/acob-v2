import { z } from "zod";

export const CERTIFICATE_ACHIEVEMENTS = ["prime", "elite", "merit", "honourable_mention", "participation"] as const;

export const issueCertificateSchema = z.object({
  recipientEmail: z.string().trim().toLowerCase().email("Enter a valid email address."),
  olympiadId: z.string().uuid(),
  attemptId: z.string().uuid().optional().or(z.literal("")),
  achievement: z.enum(CERTIFICATE_ACHIEVEMENTS),
  fileUrl: z.string().trim().url().optional().or(z.literal("")),
});

export const verifyCertificateSchema = z
  .object({
    certificateId: z.string().trim().optional(),
    token: z.string().trim().optional(),
  })
  .refine((v) => v.certificateId || v.token, { message: "Enter a certificate ID." });
