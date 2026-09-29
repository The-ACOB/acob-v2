import type { Metadata } from "next";
import Link from "next/link";
import { getCurrentSession } from "@/lib/auth/session";
import { db } from "@/lib/db/client";
import { primaryRoleLabel } from "@/lib/dashboard/nav-config";
import { DashboardPageHeader } from "@/components/dashboard/PageHeader";
import { ComparisonBars, RoleDistribution, type ExecutiveChartDatum } from "@/components/dashboard/ExecutiveCharts";
import { EmptyState } from "@/components/ui/EmptyState";
import { Activity, CheckSquare, Users, Trophy, ClipboardCheck, Medal, ScrollText, UserRound, RadioTower, ChartNoAxesCombined, Award } from "lucide-react";

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

  const roleLabels: Record<string, string> = {
    CEO: "CEO",
    COO: "COO",
    CTO: "CTO",
    CONTENT_MEDIA: "Content & media",
    HR_PR: "HR & PR",
    ACADEMIC: "Academic",
    SUPPORT: "Support",
    AMBASSADOR: "Ambassador",
    PARTICIPANT: "Participant",
  };
  const sortedRoles: ExecutiveChartDatum[] = roleCounts
    .map((row, index) => ({
      label: roleLabels[row.key] ?? row.key.replaceAll("_", " ").toLowerCase().replace(/\b\w/g, (letter) => letter.toUpperCase()),
      value: row._count.userRoles,
      index,
    }))
    .sort((a, b) => b.value - a.value || a.index - b.index)
    .map(({ label, value }) => ({ label, value }));
  const assignedAccounts = roleCounts.reduce((sum, row) => sum + row._count.userRoles, 0);
  const roleCompositionIsComplete =
    totalUsers > 0 && assignedAccounts === totalUsers && roleCounts.length <= 6;
  const olympiadStatus: ExecutiveChartDatum[] = [
    { label: "Draft", value: draftOlympiads },
    { label: "Published", value: publishedOlympiads },
    { label: "Completed", value: completedOlympiads },
  ];
  const participation: ExecutiveChartDatum[] = [
    { label: "Registrations", value: totalRegistrations },
    { label: "Attempts", value: totalAttempts },
  ];

  const actionLabels: Record<string, string> = {
    "auth:login": "Login",
    "participant:profile_updated": "Participant profile updated",
    "contact:replied": "Contact message replied",
    "olympiad:registration_closed": "Registration closed",
    "role:permissions_changed": "Role permissions changed",
  };
  const activityLabel = (action: string) =>
    actionLabels[action] ?? action.replaceAll(":", " ").replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());

  const kpis = [
    { label: "Pending approvals", value: pendingApprovals, icon: CheckSquare },
    { label: "Total accounts", value: totalUsers, icon: Users },
    { label: "Participants", value: totalParticipants, icon: UserRound },
    { label: "Ambassadors", value: totalAmbassadors, icon: RadioTower },
    { label: "Olympiads", value: totalOlympiads, icon: Trophy },
    { label: "Draft / published", value: `${draftOlympiads} / ${publishedOlympiads}`, icon: ClipboardCheck },
    { label: "Completed", value: completedOlympiads, icon: Medal },
    { label: "Registrations / attempts", value: `${totalRegistrations} / ${totalAttempts}`, icon: ChartNoAxesCombined },
    { label: "Certificates issued", value: totalCertificates, icon: Award },
    { label: "Letters issued", value: totalLetters, icon: ScrollText },
  ];

  return (
    <div className="flex flex-col gap-7">
      <section aria-label="Executive summary">
        <div className="mb-3 flex items-center justify-between">
          <p className="field-kicker">At a glance</p>
          <span className="font-mono text-[10px] tabular-nums text-muted">10 KEY MEASURES</span>
        </div>
        <div className="grid grid-cols-2 border-l border-t border-border sm:grid-cols-3 lg:grid-cols-5">
          {kpis.map(({ label, value, icon: Icon }, index) => (
            <div key={label} style={index === 0 ? { borderTopColor: "var(--color-signal)" } : undefined} className={`min-w-0 border-b border-r border-border bg-elevated px-3 py-3 sm:px-4 ${index === 0 ? "border-t-2" : ""}`}>
              <div className="flex items-center justify-between gap-2">
                <p className="min-h-7 text-[10px] leading-4 text-secondary sm:text-[11px]">{label}</p>
                <Icon aria-hidden="true" className="h-3.5 w-3.5 shrink-0 text-accent" strokeWidth={1.7} />
              </div>
              <p className="mt-1 font-mono text-xl font-medium tabular-nums tracking-tight text-primary sm:text-2xl">{value}</p>
            </div>
          ))}
        </div>
      </section>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
        <section className="min-w-0 border border-border bg-elevated p-4 sm:p-5" aria-labelledby="olympiad-overview-title">
          <div className="mb-4 flex items-end justify-between border-b border-border pb-3">
            <div>
              <p className="field-kicker">01 / Programme</p>
              <h2 id="olympiad-overview-title" className="mt-2 font-display text-xl text-primary">Olympiad overview</h2>
            </div>
            <div className="text-right">
              <span className="block font-mono text-[9px] uppercase tracking-[0.12em] text-muted">Total</span>
              <span className="font-mono text-2xl tabular-nums text-primary">{totalOlympiads}</span>
            </div>
          </div>
          <ComparisonBars data={olympiadStatus} name="Olympiads by status" />
        </section>

        <section className="min-w-0 border border-border bg-elevated p-4 sm:p-5" aria-labelledby="accounts-role-title">
          <div className="mb-4 border-b border-border pb-3">
            <p className="field-kicker">02 / Community</p>
            <h2 id="accounts-role-title" className="mt-2 font-display text-xl text-primary">Accounts by role</h2>
          </div>
          <RoleDistribution roles={sortedRoles} totalUsers={totalUsers} showDonut={roleCompositionIsComplete} />
        </section>

        <section className="min-w-0 border border-border bg-elevated p-4 sm:p-5" aria-labelledby="participation-title">
          <div className="mb-4 border-b border-border pb-3">
            <p className="field-kicker">03 / Engagement</p>
            <h2 id="participation-title" className="mt-2 font-display text-xl text-primary">Participation</h2>
          </div>
          <ComparisonBars data={participation} name="Registrations and attempts" />
        </section>

        <section className="min-w-0 border border-border bg-elevated p-4 sm:p-5" aria-labelledby="recent-activity-title">
          <div className="mb-4 flex items-end justify-between border-b border-border pb-3">
            <div>
              <p className="field-kicker">04 / Operations</p>
              <h2 id="recent-activity-title" className="mt-2 font-display text-xl text-primary">Recent activity</h2>
            </div>
            <Activity aria-hidden="true" className="mb-1 h-4 w-4 text-accent" strokeWidth={1.7} />
          </div>
          {recentActivity.length === 0 ? (
            <EmptyState title="No activity recorded yet" description="Security-sensitive actions will appear here as they happen." />
          ) : (
            <ol className="ml-1">
              {recentActivity.map((log: { id: string; action: string; createdAt: Date }, index) => (
                <li key={log.id} className="relative flex gap-3 pb-4 last:pb-0">
                  {index < recentActivity.length - 1 ? <span aria-hidden="true" className="absolute left-[5px] top-3 h-[calc(100%-4px)] w-px bg-border" /> : null}
                  <span aria-hidden="true" style={index === 0 ? { borderColor: "var(--color-signal)" } : undefined} className={`relative mt-1 h-3 w-3 shrink-0 border bg-elevated ${index === 0 ? "" : "border-border-strong"}`}>
                    {index === 0 ? <span className="absolute inset-[3px]" style={{ backgroundColor: "var(--color-signal)" }} /> : null}
                  </span>
                  <div className="flex min-w-0 flex-1 flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between">
                    <span className="text-sm leading-5 text-primary">{activityLabel(log.action)}</span>
                    <time className="shrink-0 font-mono text-[10px] tabular-nums text-muted" dateTime={log.createdAt.toISOString()}>{log.createdAt.toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })}</time>
                  </div>
                </li>
              ))}
            </ol>
          )}
        </section>
      </div>

      <section className="border-y border-border py-4" aria-label="Organisation snapshot">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="field-kicker">05 / Organisation</p>
            <h2 className="mt-1 font-display text-lg text-primary">Organisation snapshot</h2>
          </div>
          <div className="grid grid-cols-2 divide-x divide-border border border-border bg-elevated sm:min-w-[360px]">
            <div className="px-4 py-2.5">
              <span className="block text-[11px] text-secondary">Certificates issued</span>
              <span className="font-mono text-lg tabular-nums text-primary">{totalCertificates}</span>
            </div>
            <div className="px-4 py-2.5">
              <span className="block text-[11px] text-secondary">Letters issued</span>
              <span className="font-mono text-lg tabular-nums text-primary">{totalLetters}</span>
            </div>
          </div>
        </div>
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
              Olympiads you&apos;re registered for.
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
            You aren&apos;t registered for any published Olympiads yet.
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

