import { z } from "zod";

export const registerParticipantSchema = z.object({
  fullName: z.string().trim().min(2, "Enter the participant's full name."),
  email: z.string().trim().toLowerCase().email("Enter a valid email address."),
  institution: z.string().trim().max(200).optional().or(z.literal("")),
  gradeLevel: z.string().trim().max(50).optional().or(z.literal("")),
});
