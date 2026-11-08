import { z } from "zod";

export const CONTENT_KINDS = [
  "podcast",
  "study_guide",
  "video_tutorial",
  "resource",
] as const;

export const contentSchema = z.object({
  title: z.string().trim().min(3, "Title is required."),
  description: z.string().trim().max(1000).optional().or(z.literal("")),
  body: z.string().trim().max(20000).optional().or(z.literal("")),
  externalUrl: z.string().trim().url().optional().or(z.literal("")),
  fileUrl: z.string().trim().url().optional().or(z.literal("")),
  coverImageUrl: z.string().trim().url().optional().or(z.literal("")),
  isPaid: z.boolean().optional().default(false),
  price: z.union([z.number().positive(), z.string().trim().regex(/^\d+(\.\d{1,2})?$/)]).optional().nullable().or(z.literal("")),
  paymentQrCodeUrl: z.string().trim().url().optional().or(z.literal("")),
}).superRefine((value, ctx) => {
  if (value.isPaid && (!value.price || Number(value.price) <= 0)) ctx.addIssue({ code: "custom", path: ["price"], message: "Enter a valid resource price." });
  if (value.isPaid && !value.paymentQrCodeUrl) ctx.addIssue({ code: "custom", path: ["paymentQrCodeUrl"], message: "Upload the payment QR code for this resource." });
});
