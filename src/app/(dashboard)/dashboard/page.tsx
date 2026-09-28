import type { Metadata } from "next";
import Link from "next/link";
import { getCurrentSession } from "@/lib/auth/session";
import { db } from "@/lib/db/client";
import { primaryRoleLabel } from "@/lib/dashboard/nav-config";
import { DashboardPageHeader } from "@/components/dashboard/PageHeader";
import { StatCard } from "@/components/dashboard/StatCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { Users, CheckSquare, Trophy } from "lucide-react";

export const metadata: Metadata = { title: "Dashboard" };

async function ExecutiveOverview({ actorId }: { actorId: string }) {
  const [
    pendingApprovals,
    totalUsers,
    totalParticipants,
    totalAmbassadors,
    totalOlympiads,
    draftOlympiads,
    publishedOlympiads,
    completedOlympiads,
    totalRegistrations,
    totalAttempts,
    totalCertificates,
    totalLetters,
    roleCounts,
    recentActivity,
  ] = await Promise.all([
    db.approvalRequest.count({ where: { status: "pending" } }),
    db.user.count(),
    db.participant.count(),
    db.ambassador.count(),
    db.olympiad.count(),
    db.olympiad.count({ where: { status: "draft" } }),
    db.olympiad.count({ where: { status: "published" } }),
    db.olympiad.count({
      where: {
        OR: [
          { resultsPublishedAt: { not: null } },
          { endAt: { lt: new Date() } },
        ],
      },
    }),
    db.olympiadRegistration.count(),
    db.attempt.count(),
    db.certificate.count(),
    db.recommendationLetter.count(),
    db.role.findMany({
      select: { key: true, _count: { select: { userRoles: true } } },
      orderBy: { rank: "desc" },
    }),
    db.auditLog.findMany({ orderBy: { createdAt: "desc" }, take: 6 }),
  ]);

  void actorId;

  return (
    <div className="flex flex-col gap-10">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Pending approvals"
          value={pendingApprovals}
          icon={CheckSquare}
        />
        <StatCard
          label="Total accounts"
          value={totalUsers}
          icon={Users}
          hint="All registered accounts"
        />
        <StatCard label="Participants" value={totalParticipants} icon={Users} />
        <StatCard label="Ambassadors" value={totalAmbassadors} icon={Users} />
      </div>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard label="Olympiads" value={totalOlympiads} icon={Trophy} />
        <StatCard
          label="Draft / published"
          value={`${draftOlympiads} / ${publishedOlympiads}`}
        />
        <StatCard label="Completed Olympiads" value={completedOlympiads} />
        <StatCard
          label="Registrations / attempts"
          value={`${totalRegistrations} / ${totalAttempts}`}
        />
        <StatCard label="Certificates issued" value={totalCertificates} />
        <StatCard label="Letters issued" value={totalLetters} />
      </div>
      <section>
        <h2 className="mb-4 font-display text-lg text-primary">
          Users by role
        </h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {roleCounts.map((row) => (
            <div
              key={row.key}
              className="rounded-md border border-border px-4 py-3 text-sm text-secondary"
            >
              {row.key}: {row._count.userRoles}
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2 className="mb-4 font-display text-lg text-primary">
          Recent activity
        </h2>
        {recentActivity.length === 0 ? (
          <EmptyState
            title="No activity recorded yet"
            description="Security-sensitive actions will appear here as they happen."
          />
        ) : (
          <div className="flex flex-col divide-y divide-border rounded-lg border border-border">
            {recentActivity.map(
              (log: { id: string; action: string; createdAt: Date }) => (
                <div
                  key={log.id}
                  className="flex items-center justify-between px-4 py-3 text-sm"
                >
                  <span className="font-mono text-xs text-secondary">
                    {log.action}
                  </span>
                  <span className="text-xs text-muted">
                    {log.createdAt.toLocaleString()}
                  </span>
                </div>
              ),
            )}
          </div>
        )}
      </section>
    </div>
  );
}

async function RolePanels({ roleKeys, userId }: { roleKeys: string[]; userId: string }) {
  if (roleKeys.includes("HR_PR")) {
    return (
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <EmptyState
          title="Participant management"
          description="Participant records will appear here once the people module ships."
        />
        <EmptyState
          title="Ambassador management"
          description="Ambassador applications and status will appear here."
        />
        <EmptyState
          title="Contact inbox"
          description="Incoming contact submissions will appear here."
        />
        <EmptyState
          title="Careers"
          description="Manage open roles here once the careers module ships."
        />
      </div>
    );
  }

  if (roleKeys.includes("CONTENT_MEDIA")) {
    return (
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <EmptyState
          title="Inside Excellence"
          description="Episode drafts and publishing status will appear here."
        />
        <EmptyState
          title="Study guides & resources"
          description="Resource library management will appear here."
        />
      </div>
    );
  }

  if (roleKeys.includes("SUPPORT")) {
    return (
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <EmptyState
          title="Contact messages"
          description="Incoming contact form submissions will appear here."
        />
        <EmptyState
          title="Support conversations"
          description="Open support threads will appear here."
        />
      </div>
    );
  }

  if (roleKeys.includes("ACADEMIC")) {
    return (
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <EmptyState
          title="Olympiads"
          description="Olympiad tracks you manage will appear here."
        />
        <EmptyState
          title="Question bank"
          description="Draft and published questions will appear here."
        />
        <EmptyState
          title="Results & analytics"
          description="Once an Olympiad closes, results appear here."
        />
        <EmptyState
          title="Certificates"
          description="Certificate issuance queue will appear here."
        />
      </div>
    );
  }

  if (roleKeys.includes("AMBASSADOR")) {
    return (
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <EmptyState
          title="Referred participants"
          description="Participants you've registered will appear here."
        />
        <EmptyState
          title="Referral progress"
          description="Your referral standing will appear here."
        />
      </div>
    );
  }

  // PARTICIPANT (default)
  const registrations = await db.olympiadRegistration.findMany({
    where: {
      userId,
      olympiad: {
        status: "published",
      },
    },
    orderBy: { registeredAt: "desc" },
    take: 6,
    select: {
      olympiad: {
        select: {
          id: true,
          title: true,
          posterUrl: true,
          durationMinutes: true,
          startAt: true,
          endAt: true,
        },
      },
    },
  });

  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
      <section className="rounded-lg border border-border bg-elevated p-6">
        <div className="mb-5 flex items-center justify-between">
          <div>
            <h2 className="font-display text-xl text-primary">
              Active Olympiads
            </h2>
            <p className="mt-1 text-sm text-secondary">
              Olympiads you're registered for.
            </p>
          </div>
          <Link
            href="/dashboard/olympiads"
            className="text-xs font-medium text-accent underline underline-offset-4"
          >
            View all
          </Link>
        </div>

        {registrations.length === 0 ? (
          <p className="text-sm text-muted">
            You aren't registered for any published Olympiads yet.
          </p>
        ) : (
          <div className="flex flex-col gap-3">
            {registrations.map(({ olympiad }) => (
              <Link
                key={olympiad.id}
                href={`/dashboard/olympiads/${olympiad.id}/attempt`}
                className="flex items-center gap-4 rounded-md border border-border/60 p-3 transition-colors hover:border-accent/40 hover:bg-white/[0.02]"
              >
                {olympiad.posterUrl ? (
                  <img
                    src={olympiad.posterUrl}
                    alt=""
                    className="h-14 w-20 shrink-0 rounded object-cover"
                  />
                ) : (
                  <div className="flex h-14 w-20 shrink-0 items-center justify-center rounded bg-black/30">
                    <span className="text-[9px] font-mono uppercase tracking-wider text-muted">
                      ACOB
                    </span>
                  </div>
                )}

                <div className="min-w-0 flex-1">
                  <h3 className="truncate text-sm font-medium text-primary">
                    {olympiad.title}
                  </h3>
                  <p className="mt-1 text-xs text-muted">
                    {olympiad.durationMinutes} minutes
                    {olympiad.endAt
                      ? ` ? Closes ${olympiad.endAt.toLocaleDateString()}`
                      : ""}
                  </p>
                </div>

                <span className="shrink-0 text-xs font-medium text-accent">
                  View Exam
                </span>
              </Link>
            ))}
          </div>
        )}
      </section>

      <EmptyState
        title="Certificates"
        description="Certificates you've earned will appear here once issued."
      />
    </div>
  );
}

export default async function DashboardOverviewPage() {
  const session = await getCurrentSession();
  if (!session) return null;

  return (
    <div>
      <DashboardPageHeader
        title={`Welcome back${session.fullName ? `, ${session.fullName.split(" ")[0]}` : ""}`}
        description={primaryRoleLabel(session.roleKeys)}
      />

      {session.roleKeys.some((r) => ["CEO", "COO", "CTO"].includes(r)) ? (
        <ExecutiveOverview actorId={session.id} />
      ) : (
        <RolePanels roleKeys={session.roleKeys} userId={session.id} />
      )}
    </div>
  );
}

