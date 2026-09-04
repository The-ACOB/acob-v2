"use client";

import { useState } from "react";
import {
  createTeamAction,
  inviteTeamMemberAction,
  respondToTeamInvitationAction,
} from "@/lib/teams/actions";
import { Button } from "@/components/ui/Button";

type Team = {
  id: string;
  name: string;
  maxMembers: number;
  captainId: string;
  members: { name: string; email: string }[];
  invitations: { id: string }[];
};
export function TeamManager({ teams }: { teams: Team[] }) {
  const [name, setName] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  async function create() {
    setPending(true);
    const result = await createTeamAction(name);
    setPending(false);
    if (!result.ok) return setError(result.error);
    location.reload();
  }
  async function invite(teamId: string) {
    const email = window.prompt("Member email");
    if (!email) return;
    const result = await inviteTeamMemberAction(teamId, email);
    if (!result.ok) setError(result.error);
    else location.reload();
  }
  return (
    <div className="flex flex-col gap-6">
      <div className="rounded-lg border border-border bg-elevated p-5">
        <label className="text-sm text-secondary" htmlFor="team-name">
          Create team
        </label>
        <div className="mt-3 flex gap-3">
          <input
            id="team-name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            className="rounded-md border border-border-strong bg-background px-3 py-2 text-sm text-primary"
            placeholder="Team name"
          />
          <Button
            type="button"
            variant="primary"
            disabled={pending}
            onClick={create}
          >
            {pending ? "Creating..." : "Create team"}
          </Button>
        </div>
      </div>
      {error ? <p className="text-sm text-error">{error}</p> : null}
      {teams.map((team) => (
        <article
          key={team.id}
          className="rounded-lg border border-border bg-elevated p-5"
        >
          <h2 className="font-display text-xl text-primary">{team.name}</h2>
          <p className="mt-2 text-sm text-secondary">
            {team.members.length} / {team.maxMembers} members
          </p>
          <ul className="mt-4 text-sm text-secondary">
            {team.members.map((member) => (
              <li key={member.email}>
                {member.name} ({member.email})
              </li>
            ))}
          </ul>
          <Button
            type="button"
            variant="secondary"
            className="mt-4 text-xs"
            onClick={() => invite(team.id)}
          >
            Invite member
          </Button>
          {team.invitations.map((invitation) => (
            <div key={invitation.id} className="mt-4">
              <Button
                type="button"
                variant="secondary"
                className="text-xs"
                onClick={async () => {
                  await respondToTeamInvitationAction(invitation.id, true);
                  location.reload();
                }}
              >
                Accept invitation
              </Button>
            </div>
          ))}
        </article>
      ))}
    </div>
  );
}
