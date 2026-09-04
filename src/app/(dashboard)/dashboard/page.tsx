import type { Metadata } from "next";
import { getCurrentSession } from "@/lib/auth/session";
import { hasPermission } from "@/lib/authz/guards";
import { db } from "@/lib/db/client";
import { primaryRoleLabel } from "@/lib/dashboard/nav-config";
import { DashboardPageHeader } from "@/components/dashboard/PageHeader";
import { StatCard } from "@/components/dashboard/StatCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { Users, CheckSquare, Trophy } from "lucide-react";

export const metadata: Metadata = { title: "Dashboard" };

async function ExecutiveOverview({ actorId }: { actorId: string }) {
  const [pendingApprovals, totalUsers, recentActivity] = await Promise.all([
    db.approvalRequest.count({ where: { status: "pending" } }),
    db.user.count(),
    db.auditLog.findMany({ orderBy: { createdAt: "desc" }, take: 6 }),
  ]);

  void actorId;

  return (
    <div className="flex flex-col gap-10">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Pending approvals" value={pendingApprovals} icon={CheckSquare} />
        <StatCard label="Total accounts" value={totalUsers} icon={Users} hint="All registered accounts" />
        <StatCard label="Olympiad status" value="—" icon={Trophy} hint="Not yet published" />
        <StatCard label="Participants" value="—" icon={Users} hint="Not yet tracked" />
      </div>

      <section>
        <h2 className="mb-4 font-display text-lg text-primary">Recent activity</h2>
        {recentActivity.length === 0 ? (
          <EmptyState title="No activity recorded yet" description="Security-sensitive actions will appear here as they happen." />
        ) : (
          <div className="flex flex-col divide-y divide-border rounded-lg border border-border">
            {recentActivity.map((log: { id: string; action: string; createdAt: Date }) => (
              <div key={log.id} className="flex items-center justify-between px-4 py-3 text-sm">
                <span className="font-mono text-xs text-secondary">{log.action}</span>
                <span className="text-xs text-muted">{log.createdAt.toLocaleString()}</span>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function RolePanels({ roleKeys }: { roleKeys: string[] }) {
  if (roleKeys.includes("HR_PR")) {
    return (
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <EmptyState title="Participant management" description="Participant records will appear here once the people module ships." />
        <EmptyState title="Ambassador management" description="Ambassador applications and status will appear here." />
        <EmptyState title="Contact inbox" description="Incoming contact submissions will appear here." />
        <EmptyState title="Careers" description="Manage open roles here once the careers module ships." />
      </div>
    );
  }

  if (roleKeys.includes("CONTENT_MEDIA")) {
    return (
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <EmptyState title="Inside Excellence" description="Episode drafts and publishing status will appear here." />
        <EmptyState title="Study guides & resources" description="Resource library management will appear here." />
      </div>
    );
  }

  if (roleKeys.includes("SUPPORT")) {
    return (
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <EmptyState title="Contact messages" description="Incoming contact form submissions will appear here." />
        <EmptyState title="Support conversations" description="Open support threads will appear here." />
      </div>
    );
  }

  if (roleKeys.includes("ACADEMIC")) {
    return (
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <EmptyState title="Olympiads" description="Olympiad tracks you manage will appear here." />
        <EmptyState title="Question bank" description="Draft and published questions will appear here." />
        <EmptyState title="Results & analytics" description="Once an Olympiad closes, results appear here." />
        <EmptyState title="Certificates" description="Certificate issuance queue will appear here." />
      </div>
    );
  }

  if (roleKeys.includes("AMBASSADOR")) {
    return (
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <EmptyState title="Referred participants" description="Participants you've registered will appear here." />
        <EmptyState title="Referral progress" description="Your referral standing will appear here." />
      </div>
    );
  }

  // PARTICIPANT (default)
  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
      <EmptyState title="Active Olympiads" description="Olympiads you're registered for will appear here." />
      <EmptyState title="Certificates" description="Certificates you've earned will appear here once issued." />
    </div>
  );
}

export default async function DashboardOverviewPage() {
  const session = await getCurrentSession();
  if (!session) return null;

  const isExecutive = session.roleKeys.some((r) => ["CEO", "COO", "CTO"].includes(r));
  const canViewApprovals = isExecutive && (await hasPermission("approval:view"));

  return (
    <div>
      <DashboardPageHeader
        title={`Welcome back${session.fullName ? `, ${session.fullName.split(" ")[0]}` : ""}`}
        description={primaryRoleLabel(session.roleKeys)}
      />

      {isExecutive && canViewApprovals ? (
        <ExecutiveOverview actorId={session.id} />
      ) : (
        <RolePanels roleKeys={session.roleKeys} />
      )}
    </div>
  );
}
