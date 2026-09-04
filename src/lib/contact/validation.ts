import { z } from "zod";

export const CONTACT_CATEGORIES = ["general", "olympiads", "ambassadors", "media", "careers"] as const;

export const contactSubmitSchema = z.object({
  name: z.string().trim().min(2, "Enter your full name."),
  email: z.string().trim().toLowerCase().email("Enter a valid email address."),
  subject: z.string().trim().min(3, "Add a short subject line."),
  category: z.enum(CONTACT_CATEGORIES),
  message: z.string().trim().min(20, "Say a little more — at least 20 characters."),
});
