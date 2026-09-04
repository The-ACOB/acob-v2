import { getCurrentSession } from "@/lib/auth/session";
import { db } from "@/lib/db/client";
import { DashboardPageHeader } from "@/components/dashboard/PageHeader";
import { TeamManager } from "@/components/dashboard/TeamManager";

export default async function TeamsPage() {
  const session = await getCurrentSession();
  if (!session) return null;
  const teams = await db.team.findMany({
    where: session.roleKeys.includes("CEO")
      ? undefined
      : { members: { some: { userId: session.id, status: "active" } } },
    include: {
      members: { include: { user: { include: { profile: true } } } },
      invitations: { where: { inviteeId: session.id, status: "pending" } },
    },
    orderBy: { createdAt: "desc" },
  });
  return (
    <div>
      <DashboardPageHeader
        title="My Teams"
        description="Create a team, manage invitations, and prepare for team Olympiads."
        breadcrumbs={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "My Teams" },
        ]}
      />
      <TeamManager
        teams={teams.map((team) => ({
          id: team.id,
          name: team.name,
          maxMembers: team.maxMembers,
          captainId: team.captainId,
          members: team.members.map((member) => ({
            name: member.user.profile?.fullName ?? member.user.email,
            email: member.user.email,
          })),
          invitations: team.invitations.map((invitation) => ({
            id: invitation.id,
          })),
        }))}
      />
    </div>
  );
}
