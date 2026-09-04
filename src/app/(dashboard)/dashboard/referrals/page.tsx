import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentSession } from "@/lib/auth/session";
import { AuthError } from "@/lib/authz/guards";
import { db } from "@/lib/db/client";
import { DashboardPageHeader } from "@/components/dashboard/PageHeader";
import { DataTable, type Column } from "@/components/dashboard/DataTable";
import { EmptyState } from "@/components/ui/EmptyState";
import { Badge } from "@/components/ui/Badge";

export const metadata: Metadata = { title: "Referred Participants" };

type ReferralRow = {
  id: string;
  participant: {
    institution: string | null;
    gradeLevel: string | null;
    user: {
      email: string;
      status: "active" | "suspended";
      emailVerifiedAt: Date | null;
      profile: { fullName: string } | null;
    } | null;
  };
  createdAt: Date;
};

export default async function ReferralsPage() {
  const session = await getCurrentSession();
  if (!session) redirect("/login");

  // Ownership-scoped by design: an ambassador only ever sees their OWN
  // referrals — there is no query path here that returns anyone else's.
  const ambassador = await db.ambassador.findUnique({
    where: { userId: session.id },
  });

  if (!ambassador) {
    if (!session.roleKeys.includes("AMBASSADOR")) redirect("/dashboard");
    throw new AuthError("Ambassador profile not found.", 404);
  }

  const referrals: ReferralRow[] = await db.ambassadorReferral.findMany({
    where: { ambassadorId: ambassador.id },
    include: {
      participant: {
        include: {
          user: {
            include: {
              profile: true,
            },
          },
        },
      },
    },
  });

  const columns: Column<ReferralRow>[] = [
    {
      header: "Name",
      cell: (r) => r.participant.user?.profile?.fullName ?? "—",
    },
    {
      header: "Email",
      cell: (r) => r.participant.user?.email ?? "—",
    },
    {
      header: "Institution",
      cell: (r) => r.participant.institution ?? "—",
    },
    {
      header: "Status",
      cell: (r) => (
        <Badge
          tone={r.participant.user?.emailVerifiedAt ? "success" : "warning"}
        >
          {r.participant.user?.emailVerifiedAt
            ? "Verified"
            : "Pending verification"}
        </Badge>
      ),
    },
    {
      header: "Registered",
      cell: (r) => (
        <span className="text-xs text-muted">
          {r.createdAt.toLocaleDateString()}
        </span>
      ),
    },
  ];

  return (
    <div>
      <DashboardPageHeader
        title="Referred Participants"
        description="Participants you've personally registered. You cannot see other ambassadors' referrals."
        breadcrumbs={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Referred Participants" },
        ]}
      />

      {referrals.length === 0 ? (
        <EmptyState
          title="No referrals yet"
          description="Participants you register will appear here."
        />
      ) : (
        <DataTable
          columns={columns}
          rows={referrals}
          getRowId={(r) => r.id}
          emptyTitle="No referrals yet"
        />
      )}
    </div>
  );
}
