"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db/client";
import { requirePermission, AuthError } from "@/lib/authz/guards";
import { recordAudit } from "@/lib/audit";
import { careerSchema } from "./validation";
import type { ActionResult } from "@/lib/auth/actions";

export async function createCareerAction(input: unknown): Promise<ActionResult> {
  let actor;
  try {
    actor = await requirePermission("career:create");
  } catch (err) {
    if (err instanceof AuthError) return { ok: false, error: err.message };
    throw err;
  }

  const parsed = careerSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }
  const v = parsed.data;

  await db.careerListing.create({
    data: {
      title: v.title,
      department: v.department || null,
      description: v.description,
      requirements: v.requirements || null,
      deadline: v.deadline ? new Date(v.deadline) : null,
      createdBy: actor.id,
    },
  });

  await recordAudit({ actorId: actor.id, action: "career:created", targetType: "career_listing" });
  revalidatePath("/dashboard/careers");
  revalidatePath("/careers");
  return { ok: true };
}

export async function updateCareerAction(id: string, input: unknown): Promise<ActionResult> {
  let actor;
  try {
    actor = await requirePermission("career:update");
  } catch (err) {
    if (err instanceof AuthError) return { ok: false, error: err.message };
    throw err;
  }

  const parsed = careerSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }
  const v = parsed.data;

  await db.careerListing.update({
    where: { id },
    data: {
      title: v.title,
      department: v.department || null,
      description: v.description,
      requirements: v.requirements || null,
      deadline: v.deadline ? new Date(v.deadline) : null,
    },
  });

  await recordAudit({ actorId: actor.id, action: "career:updated", targetType: "career_listing", targetId: id });
  revalidatePath("/dashboard/careers");
  revalidatePath("/careers");
  return { ok: true };
}

export async function setCareerStatusAction(id: string, status: "published" | "closed" | "draft"): Promise<ActionResult> {
  let actor;
  try {
    actor = await requirePermission("career:update");
  } catch (err) {
    if (err instanceof AuthError) return { ok: false, error: err.message };
    throw err;
  }

  await db.careerListing.update({
    where: { id },
    data: status === "published" ? { status, publishAt: new Date() } : { status },
  });

  await recordAudit({ actorId: actor.id, action: `career:${status}`, targetType: "career_listing", targetId: id });
  revalidatePath("/dashboard/careers");
  revalidatePath("/careers");
  return { ok: true };
}
