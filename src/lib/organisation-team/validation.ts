import { z } from "zod";

export const organisationTeamMemberSchema = z.object({
  name: z.string().trim().min(2, "Name is required.").max(160),
  title: z.string().trim().min(2, "Position is required.").max(160),
  bio: z.string().trim().max(2000).optional().or(z.literal("")),
  imageUrl: z.string().trim().max(500).optional().or(z.literal("")),
  displayOrder: z.number().int().min(0).max(10000),
  active: z.boolean(),
  linkedinUrl: z.string().trim().url().max(500).optional().or(z.literal("")),
  websiteUrl: z.string().trim().url().max(500).optional().or(z.literal("")),
});
