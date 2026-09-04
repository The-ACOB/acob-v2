import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { requirePermission, AuthError } from "@/lib/authz/guards";
import { db } from "@/lib/db/client";
import { DashboardPageHeader } from "@/components/dashboard/PageHeader";
import { ApprovalCard, type ApprovalRow } from "@/components/dashboard/ApprovalCard";
import { EmptyState } from "@/components/ui/EmptyState";

export const metadata: Metadata = { title: "Approvals" };

type RawApproval = {
  id: string;
  type: string;
  targetType: string;
  targetId: string;
  reason: string | null;
  createdAt: Date;
  requestedBy: string;
  requester: { id: string; email: string; profile: { fullName: string } | null } | null;
};

export default async function ApprovalsPage() {
  let actor;
  try {
    actor = await requirePermission("approval:view");
  } catch (err) {
    if (err instanceof AuthError) redirect("/dashboard");
    throw err;
  }

  const pending: RawApproval[] = await db.approvalRequest.findMany({
    where: { status: "pending" },
    orderBy: { createdAt: "desc" },
    include: { requester: { include: { profile: true } } },
  });

  const rows: ApprovalRow[] = pending.map((r) => ({
    id: r.id,
    type: r.type,
    targetType: r.targetType,
    targetId: r.targetId,
    reason: r.reason,
    createdAt: r.createdAt.toISOString(),
    requester: {
      email: r.requester?.email ?? "unknown",
      fullName: r.requester?.profile?.fullName ?? null,
    },
    isSelf: r.requestedBy === actor.id,
  }));

  return (
    <div>
      <DashboardPageHeader
        title="Approvals"
        description="Requests awaiting executive review. You cannot approve or reject your own requests."
        breadcrumbs={[{ label: "Dashboard", href: "/dashboard" }, { label: "Approvals" }]}
      />

      {rows.length === 0 ? (
        <EmptyState
          title="No pending approvals"
          description="When a request needs executive sign-off — a role change, a sensitive update — it will appear here."
        />
      ) : (
        <div className="flex flex-col gap-4">
          {rows.map((row) => (
            <ApprovalCard key={row.id} request={row} />
          ))}
        </div>
      )}
    </div>
  );
}
