import { z } from "zod";

export const registerParticipantSchema = z.object({
  fullName: z.string().trim().min(2, "Enter the participant's full name."),
  email: z.string().trim().toLowerCase().email("Enter a valid email address."),
  institution: z.string().trim().max(200).optional().or(z.literal("")),
  gradeLevel: z.string().trim().max(50).optional().or(z.literal("")),
});

export const updateParticipantProfileSchema = z.object({
  email: z
    .string()
    .trim()
    .toLowerCase()
    .email("Enter a valid email address.")
    .optional(),
  fullName: z.string().trim().min(2, "Enter the participant's full name."),
  phone: z.string().trim().max(30).optional().or(z.literal("")),
  gender: z.string().trim().max(50).optional().or(z.literal("")),
  institution: z.string().trim().max(200).optional().or(z.literal("")),
  gradeLevel: z.string().trim().max(50).optional().or(z.literal("")),
  academicLevel: z.string().trim().max(100).optional().or(z.literal("")),
  district: z.string().trim().max(100).optional().or(z.literal("")),
  address: z.string().trim().max(500).optional().or(z.literal("")),
  city: z.string().trim().max(100).optional().or(z.literal("")),
});
