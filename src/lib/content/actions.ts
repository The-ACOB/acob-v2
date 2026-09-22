"use server";

import { revalidatePath } from "next/cache";
import { del } from "@vercel/blob";
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

/**
 * Safely delete a Vercel Blob.
 *
 * Failure to delete an old Blob should not prevent the
 * database update from succeeding.
 */
async function deleteBlobSafely(url: string | null | undefined): Promise<void> {
  if (!url) return;

  try {
    await del(url);
  } catch (error) {
    console.error("Failed to delete Vercel Blob:", url, error);
  }
}

/**
 * Delete a Blob uploaded during the current form session.
 *
 * This is used when an admin uploads a file but then removes it
 * or cancels the form before the file becomes part of a content record.
 */
export async function deleteUploadedBlobAction(
  url: string,
): Promise<ActionResult> {
  let actor;

  try {
    actor = await requirePermission("content:update");
  } catch (err) {
    if (err instanceof AuthError) {
      return { ok: false, error: err.message };
    }

    throw err;
  }

  /*
   * Only permit deletion of Vercel Blob URLs.
   *
   * This prevents this server action from being used as a
   * generic remote-resource deletion endpoint.
   */
  try {
    const parsedUrl = new URL(url);

    if (!parsedUrl.hostname.endsWith(".public.blob.vercel-storage.com")) {
      return {
        ok: false,
        error: "Invalid Blob URL.",
      };
    }
  } catch {
    return {
      ok: false,
      error: "Invalid Blob URL.",
    };
  }

  try {
    await del(url);

    await recordAudit({
      actorId: actor.id,
      action: "content:file_deleted",
      targetType: "content",
      targetId: url,
    });

    return { ok: true };
  } catch (error) {
    console.error("Failed to delete Vercel Blob:", error);

    return {
      ok: false,
      error: "Could not delete uploaded file.",
    };
  }
}

export async function createContentAction(
  kind: (typeof CONTENT_KINDS)[number],
  input: unknown,
): Promise<ActionResult> {
  let actor;

  try {
    actor = await requirePermission("content:create");
  } catch (err) {
    if (err instanceof AuthError) {
      return { ok: false, error: err.message };
    }

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

      // Uploaded study guide files
      fileUrl: v.fileUrl || null,
      coverImageUrl: v.coverImageUrl || null,

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
    if (err instanceof AuthError) {
      return { ok: false, error: err.message };
    }

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

  /*
   * Get the current URLs before updating the record.
   *
   * We need these to determine whether an existing PDF or
   * cover image was removed/replaced.
   */
  const existing = await db.content.findUnique({
    where: { id },
    select: {
      fileUrl: true,
      coverImageUrl: true,
    },
  });

  if (!existing) {
    return {
      ok: false,
      error: "Content not found.",
    };
  }

  const newFileUrl = v.fileUrl || null;
  const newCoverImageUrl = v.coverImageUrl || null;

  await db.content.update({
    where: { id },
    data: {
      title: v.title,
      description: v.description || null,
      body: v.body || null,
      externalUrl: v.externalUrl || null,

      // Save the current file state
      fileUrl: newFileUrl,
      coverImageUrl: newCoverImageUrl,
    },
  });

  /*
   * PDF was removed or replaced.
   *
   * If the URL is unchanged, nothing is deleted.
   */
  if (existing.fileUrl && existing.fileUrl !== newFileUrl) {
    await deleteBlobSafely(existing.fileUrl);
  }

  /*
   * Cover image was removed or replaced.
   *
   * Again, unchanged URLs are left untouched.
   */
  if (existing.coverImageUrl && existing.coverImageUrl !== newCoverImageUrl) {
    await deleteBlobSafely(existing.coverImageUrl);
  }

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
    if (err instanceof AuthError) {
      return { ok: false, error: err.message };
    }

    throw err;
  }

  await db.content.update({
    where: { id },
    data:
      status === "published"
        ? {
            status,
            publishedAt: new Date(),
          }
        : {
            status,
          },
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
