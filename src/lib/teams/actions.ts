"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db/client";
import { requireAuth, AuthError } from "@/lib/authz/guards";
import { recordAudit } from "@/lib/audit";
import type { ActionResult } from "@/lib/auth/actions";

export async function createTeamAction(
  name: string,
  maxMembers = 4,
): Promise<ActionResult<{ id: string }>> {
  let actor;
  try {
    actor = await requireAuth();
  } catch (err) {
    if (err instanceof AuthError) return { ok: false, error: err.message };
    throw err;
  }
  const cleanName = name.trim();
  if (
    cleanName.length < 2 ||
    cleanName.length > 100 ||
    maxMembers < 2 ||
    maxMembers > 20
  )
    return { ok: false, error: "Enter a valid team name and size." };
  const team = await db.$transaction(async (tx) => {
    const created = await tx.team.create({
      data: { name: cleanName, captainId: actor.id, maxMembers },
    });
    await tx.teamMember.create({
      data: { teamId: created.id, userId: actor.id, status: "active" },
    });
    return created;
  });
  await recordAudit({
    actorId: actor.id,
    action: "team:created",
    targetType: "team",
    targetId: team.id,
  });
  revalidatePath("/dashboard/teams");
  return { ok: true, data: { id: team.id } };
}

export async function inviteTeamMemberAction(
  teamId: string,
  email: string,
): Promise<ActionResult> {
  let actor;
  try {
    actor = await requireAuth();
  } catch (err) {
    if (err instanceof AuthError) return { ok: false, error: err.message };
    throw err;
  }
  const invitee = await db.user.findUnique({
    where: { email: email.trim().toLowerCase() },
  });
  const team = await db.team.findFirst({
    where: { id: teamId, captainId: actor.id },
    include: { members: true },
  });
  if (!team || !invitee) return { ok: false, error: "Team or user not found." };
  if (team.members.length >= team.maxMembers)
    return { ok: false, error: "This team is full." };
  if (team.members.some((member) => member.userId === invitee.id))
    return { ok: false, error: "That user is already a team member." };
  await db.teamInvitation.upsert({
    where: { teamId_inviteeId: { teamId, inviteeId: invitee.id } },
    create: { teamId, inviteeId: invitee.id },
    update: { status: "pending" },
  });
  revalidatePath("/dashboard/teams");
  return { ok: true };
}

export async function respondToTeamInvitationAction(
  invitationId: string,
  accept: boolean,
): Promise<ActionResult> {
  let actor;
  try {
    actor = await requireAuth();
  } catch (err) {
    if (err instanceof AuthError) return { ok: false, error: err.message };
    throw err;
  }
  const invitation = await db.teamInvitation.findFirst({
    where: { id: invitationId, inviteeId: actor.id, status: "pending" },
    include: { team: { include: { members: true } } },
  });
  if (!invitation) return { ok: false, error: "Invitation not found." };
  if (!accept) {
    await db.teamInvitation.update({
      where: { id: invitationId },
      data: { status: "declined" },
    });
    return { ok: true };
  }
  if (invitation.team.members.length >= invitation.team.maxMembers)
    return { ok: false, error: "This team is full." };
  await db.$transaction([
    db.teamMember.create({
      data: { teamId: invitation.teamId, userId: actor.id, status: "active" },
    }),
    db.teamInvitation.update({
      where: { id: invitationId },
      data: { status: "accepted" },
    }),
  ]);
  revalidatePath("/dashboard/teams");
  return { ok: true };
}

export async function registerTeamForOlympiadAction(
  olympiadId: string,
  teamId: string,
): Promise<ActionResult> {
  let actor;
  try {
    actor = await requireAuth();
  } catch (err) {
    if (err instanceof AuthError) return { ok: false, error: err.message };
    throw err;
  }
  const olympiad = await db.olympiad.findUnique({ where: { id: olympiadId } });
  const team = await db.team.findFirst({
    where: { id: teamId, captainId: actor.id },
    include: { members: true },
  });
  if (!olympiad || olympiad.participationMode !== "team")
    return { ok: false, error: "This Olympiad is not a team Olympiad." };
  if (!team || team.members.length < 2)
    return { ok: false, error: "A team needs at least two active members." };
  const existing = await db.teamRegistration.findUnique({
    where: { olympiadId_teamId: { olympiadId, teamId } },
  });
  if (existing) return { ok: true };
  const memberRegistration = await db.teamRegistration.findFirst({
    where: {
      olympiadId,
      team: {
        members: {
          some: {
            userId: { in: team.members.map((member) => member.userId) },
            status: "active",
          },
        },
      },
    },
  });
  if (memberRegistration)
    return {
      ok: false,
      error:
        "A team member is already registered with another team for this Olympiad.",
    };
  await db.teamRegistration.create({ data: { olympiadId, teamId } });
  return { ok: true };
}
