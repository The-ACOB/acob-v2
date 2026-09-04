import type { Metadata } from "next";
import { redirect, notFound } from "next/navigation";
import { requirePermission, AuthError } from "@/lib/authz/guards";
import { db } from "@/lib/db/client";
import { DashboardPageHeader } from "@/components/dashboard/PageHeader";
import { ParticipantProfileActions } from "@/components/dashboard/ParticipantProfileActions";
import { ParticipantProfileForm } from "@/components/dashboard/ParticipantProfileForm";
import { Badge } from "@/components/ui/Badge";

export const metadata: Metadata = { title: "Participant Profile" };

export default async function ParticipantProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  let actor;
  try {
    actor = await requirePermission("participant:view");
  } catch (err) {
    if (err instanceof AuthError) redirect("/dashboard");
    throw err;
  }

  const { id: userId } = await params;
  const user = await db.user.findUnique({
    where: { id: userId },
    include: { userRoles: { include: { role: true } } },
  });
  if (!user) notFound();

  const [profile, participant] = await Promise.all([
    db.profile.findUnique({ where: { userId } }),
    db.participant.findUnique({ where: { userId } }),
  ]);

  const isAmbassador = Boolean(
    await db.ambassador.findUnique({ where: { userId } }),
  );

  return (
    <div>
      <DashboardPageHeader
        title={profile?.fullName ?? user.email}
        breadcrumbs={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Participants", href: "/dashboard/participants" },
          { label: profile?.fullName ?? user.email },
        ]}
        actions={
          <ParticipantProfileActions
            userId={userId}
            alreadyAmbassador={isAmbassador}
            isCeo={actor.roleKeys.includes("CEO")}
          />
        }
      />

      <dl className="grid grid-cols-1 gap-6 rounded-lg border border-border bg-elevated p-6 sm:grid-cols-2">
        <div>
          <dt className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted">
            Email
          </dt>
          <dd className="mt-1 text-sm text-primary">{user.email}</dd>
        </div>
        <div>
          <dt className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted">
            Status
          </dt>
          <dd className="mt-1">
            <Badge tone={user.status === "active" ? "success" : "error"}>
              {user.status}
            </Badge>
          </dd>
        </div>
        <div>
          <dt className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted">
            Institution
          </dt>
          <dd className="mt-1 text-sm text-secondary">
            {participant?.institution ?? "—"}
          </dd>
        </div>
        <div>
          <dt className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted">
            Grade level
          </dt>
          <dd className="mt-1 text-sm text-secondary">
            {participant?.gradeLevel ?? "—"}
          </dd>
        </div>
        <div>
          <dt className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted">
            Email verified
          </dt>
          <dd className="mt-1 text-sm text-secondary">
            {user.emailVerifiedAt ? "Yes" : "No"}
          </dd>
        </div>
        <div>
          <dt className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted">
            Joined
          </dt>
          <dd className="mt-1 text-sm text-secondary">
            {user.createdAt.toLocaleDateString()}
          </dd>
        </div>
        <div>
          <dt className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted">
            Roles
          </dt>
          <dd className="mt-1 text-sm text-secondary">
            {user.userRoles
              .map((assignment) => assignment.role.label)
              .join(", ") || "—"}
          </dd>
        </div>
      </dl>
      <ParticipantProfileForm
        userId={userId}
        defaultValues={{
          fullName: profile?.fullName ?? "",
          institution: participant?.institution ?? "",
          gradeLevel: participant?.gradeLevel ?? "",
        }}
      />
    </div>
  );
}
