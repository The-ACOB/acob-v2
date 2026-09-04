"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db/client";
import { requirePermission, AuthError } from "@/lib/authz/guards";
import { recordAudit } from "@/lib/audit";
import { contentSchema, type CONTENT_KINDS } from "./validation";
import type { ActionResult } from "@/lib/auth/actions";

function slugify(title: string): string {
  return (
    title
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "") || "content"
  );
}

async function uniqueSlug(title: string): Promise<string> {
  const base = slugify(title);
  let slug = base;
  let i = 1;
  while (await db.content.findUnique({ where: { slug } })) {
    slug = `${base}-${i++}`;
  }
  return slug;
}

export async function createContentAction(
  kind: (typeof CONTENT_KINDS)[number],
  input: unknown,
): Promise<ActionResult> {
  let actor;
  try {
    actor = await requirePermission("content:create");
  } catch (err) {
    if (err instanceof AuthError) return { ok: false, error: err.message };
    throw err;
  }

  const parsed = contentSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Invalid input.",
    };
  }
  const v = parsed.data;
  const slug = await uniqueSlug(v.title);

  await db.content.create({
    data: {
      kind,
      title: v.title,
      slug,
      description: v.description || null,
      body: v.body || null,
      externalUrl: v.externalUrl || null,
      createdBy: actor.id,
    },
  });

  await recordAudit({
    actorId: actor.id,
    action: "content:created",
    targetType: "content",
    targetId: slug,
    metadata: { kind },
  });
  revalidatePath(`/dashboard/${kindToPath(kind)}`);
  revalidatePath(`/${kindToPath(kind)}`);
  return { ok: true };
}

export async function updateContentAction(
  id: string,
  kind: (typeof CONTENT_KINDS)[number],
  input: unknown,
): Promise<ActionResult> {
  let actor;
  try {
    actor = await requirePermission("content:update");
  } catch (err) {
    if (err instanceof AuthError) return { ok: false, error: err.message };
    throw err;
  }

  const parsed = contentSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Invalid input.",
    };
  }
  const v = parsed.data;

  await db.content.update({
    where: { id },
    data: {
      title: v.title,
      description: v.description || null,
      body: v.body || null,
      externalUrl: v.externalUrl || null,
    },
  });

  await recordAudit({
    actorId: actor.id,
    action: "content:updated",
    targetType: "content",
    targetId: id,
  });
  revalidatePath(`/dashboard/${kindToPath(kind)}`);
  revalidatePath(`/${kindToPath(kind)}`);
  return { ok: true };
}

export async function setContentStatusAction(
  id: string,
  kind: (typeof CONTENT_KINDS)[number],
  status: "published" | "unpublished" | "archived",
): Promise<ActionResult> {
  const permission =
    status === "archived" ? "content:delete" : "content:publish";
  let actor;
  try {
    actor = await requirePermission(permission);
  } catch (err) {
    if (err instanceof AuthError) return { ok: false, error: err.message };
    throw err;
  }

  await db.content.update({
    where: { id },
    data:
      status === "published" ? { status, publishedAt: new Date() } : { status },
  });

  await recordAudit({
    actorId: actor.id,
    action: status === "archived" ? "content:archived" : `content:${status}`,
    targetType: "content",
    targetId: id,
  });

  revalidatePath(`/dashboard/${kindToPath(kind)}`);
  revalidatePath(`/${kindToPath(kind)}`);
  return { ok: true };
}

function kindToPath(kind: string): string {
  const map: Record<string, string> = {
    podcast: "podcasts",
    study_guide: "study-guides",
    video_tutorial: "tutorials",
    resource: "resources",
  };
  return map[kind] ?? "resources";
}
