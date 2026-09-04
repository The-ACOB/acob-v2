"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db/client";
import { requireRole, AuthError } from "@/lib/authz/guards";
import { recordAudit } from "@/lib/audit";
import type { ActionResult } from "@/lib/auth/actions";
import { organisationTeamMemberSchema } from "./validation";
import type { z } from "zod";

type MemberValues = z.infer<typeof organisationTeamMemberSchema>;

async function requireCeo() {
  try {
    return await requireRole("CEO");
  } catch (err) {
    if (err instanceof AuthError) return null;
    throw err;
  }
}

function parseInput(
  input: unknown,
): { value: MemberValues } | { error: string } {
  const parsed = organisationTeamMemberSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }
  return { value: parsed.data };
}

export async function createOrganisationTeamMemberAction(
  input: unknown,
): Promise<ActionResult<{ id: string }>> {
  const actor = await requireCeo();
  if (!actor)
    return {
      ok: false,
      error: "You must be the CEO to manage the organisation team.",
    };
  const parsed = parseInput(input);
  if ("error" in parsed) return { ok: false, error: parsed.error };
  const v = parsed.value;

  const member = await db.organisationTeamMember.create({
    data: {
      name: v.name,
      title: v.title,
      bio: v.bio || null,
      imageUrl: v.imageUrl || null,
      displayOrder: v.displayOrder,
      active: v.active,
      linkedinUrl: v.linkedinUrl || null,
      websiteUrl: v.websiteUrl || null,
      createdBy: actor.id,
    },
  });
  await recordAudit({
    actorId: actor.id,
    action: "organisation_team:created",
    targetType: "organisation_team_member",
    targetId: member.id,
  });
  revalidatePath("/dashboard/organisation-team");
  revalidatePath("/team");
  return { ok: true, data: { id: member.id } };
}

export async function updateOrganisationTeamMemberAction(
  id: string,
  input: unknown,
): Promise<ActionResult> {
  const actor = await requireCeo();
  if (!actor)
    return {
      ok: false,
      error: "You must be the CEO to manage the organisation team.",
    };
  const parsed = parseInput(input);
  if ("error" in parsed) return { ok: false, error: parsed.error };
  const v = parsed.value;

  await db.organisationTeamMember.update({
    where: { id },
    data: {
      name: v.name,
      title: v.title,
      bio: v.bio || null,
      imageUrl: v.imageUrl || null,
      displayOrder: v.displayOrder,
      active: v.active,
      linkedinUrl: v.linkedinUrl || null,
      websiteUrl: v.websiteUrl || null,
    },
  });
  await recordAudit({
    actorId: actor.id,
    action: "organisation_team:updated",
    targetType: "organisation_team_member",
    targetId: id,
  });
  revalidatePath("/dashboard/organisation-team");
  revalidatePath("/team");
  return { ok: true };
}
