"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db/client";
import { requirePermission, AuthError } from "@/lib/authz/guards";
import { recordAudit } from "@/lib/audit";
import { popupSchema } from "./validation";
import type { ActionResult } from "@/lib/auth/actions";

export async function createPopupAction(input: unknown): Promise<ActionResult> {
  let actor;
  try {
    actor = await requirePermission("popup:manage");
  } catch (err) {
    if (err instanceof AuthError) return { ok: false, error: err.message };
    throw err;
  }

  const parsed = popupSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }
  const v = parsed.data;

  await db.popup.create({
    data: {
      content: v.content,
      ctaLabel: v.ctaLabel || null,
      ctaUrl: v.ctaUrl || null,
      startAt: v.startAt ? new Date(v.startAt) : null,
      endAt: v.endAt ? new Date(v.endAt) : null,
      priority: v.priority ?? 0,
      createdBy: actor.id,
    },
  });

  await recordAudit({ actorId: actor.id, action: "popup:created", targetType: "popup" });
  revalidatePath("/dashboard/popups");
  return { ok: true };
}

export async function togglePopupAction(id: string, active: boolean): Promise<ActionResult> {
  let actor;
  try {
    actor = await requirePermission("popup:manage");
  } catch (err) {
    if (err instanceof AuthError) return { ok: false, error: err.message };
    throw err;
  }

  await db.popup.update({ where: { id }, data: { active } });

  await recordAudit({ actorId: actor.id, action: active ? "popup:activated" : "popup:deactivated", targetType: "popup", targetId: id });
  revalidatePath("/dashboard/popups");
  return { ok: true };
}
