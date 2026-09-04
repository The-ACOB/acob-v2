import { z } from "zod";

export const careerSchema = z.object({
  title: z.string().trim().min(3, "Title is required."),
  department: z.string().trim().max(120).optional().or(z.literal("")),
  description: z.string().trim().min(10, "Add a description."),
  requirements: z.string().trim().max(3000).optional().or(z.literal("")),
  deadline: z.string().optional().or(z.literal("")),
});
