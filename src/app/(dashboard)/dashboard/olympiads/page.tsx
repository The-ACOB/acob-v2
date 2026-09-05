import type { Metadata } from "next";
import Link from "next/link";
import { getCurrentSession } from "@/lib/auth/session";
import { hasPermission } from "@/lib/authz/guards";
import { db } from "@/lib/db/client";
import { DashboardPageHeader } from "@/components/dashboard/PageHeader";
import { DataTable, type Column } from "@/components/dashboard/DataTable";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";

export const metadata: Metadata = { title: "Olympiads" };

type StaffRow = {
  id: string;
  title: string;
  status: "draft" | "published" | "unpublished";
  durationMinutes: number;
  createdAt: Date;
};

const STATUS_TONE = {
  draft: "neutral",
  published: "success",
  unpublished: "warning",
} as const;

export default async function OlympiadsPage() {
  const session = await getCurrentSession();
  if (!session) return null;

  const canManage = await hasPermission("olympiad:create");

  if (canManage) {
    const olympiads: StaffRow[] = await db.olympiad.findMany({
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    const columns: Column<StaffRow>[] = [
      {
        header: "Title",
        cell: (r) => <span className="text-primary">{r.title}</span>,
      },
      {
        header: "Status",
        cell: (r) => <Badge tone={STATUS_TONE[r.status]}>{r.status}</Badge>,
      },
      {
        header: "Duration",
        cell: (r) => `${r.durationMinutes} min`,
      },
      {
        header: "Created",
        cell: (r) => (
          <span className="text-xs text-muted">
            {r.createdAt.toLocaleDateString()}
          </span>
        ),
      },
      {
        header: "",
        hideLabel: true,
        cell: (r) => (
          <Link
            href={`/dashboard/olympiads/${r.id}`}
            className="text-xs text-accent underline underline-offset-4"
          >
            Manage
          </Link>
        ),
      },
    ];

    return (
      <div>
        <DashboardPageHeader
          title="Olympiads"
          description="Create, schedule, and manage ACOB Olympiads."
          breadcrumbs={[
            { label: "Dashboard", href: "/dashboard" },
            { label: "Olympiads" },
          ]}
          actions={
            <Button
              href="/dashboard/olympiads/new"
              variant="primary"
              className="text-xs"
            >
              New Olympiad
            </Button>
          }
        />

        <DataTable
          columns={columns}
          rows={olympiads}
          getRowId={(r) => r.id}
          emptyTitle="No Olympiads yet"
          emptyDescription="Create the first Olympiad to get started."
        />
      </div>
    );
  }

  // Participant / Ambassador view
  const published: {
    id: string;
    title: string;
    description: string | null;
    durationMinutes: number;
    startAt: Date | null;
    endAt: Date | null;
  }[] = await db.olympiad.findMany({
    where: { status: "published" },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  const [myAttempts, myRegistrations] = await Promise.all([
    db.attempt.findMany({
      where: { userId: session.id },
      select: {
        olympiadId: true,
        status: true,
      },
    }),
    db.olympiadRegistration.findMany({
      where: { userId: session.id },
      select: {
        olympiadId: true,
      },
    }),
  ]);

  const attemptByOlympiad = new Map(
    myAttempts.map((attempt) => [attempt.olympiadId, attempt.status]),
  );

  const registeredOlympiads = new Set(
    myRegistrations.map((registration) => registration.olympiadId),
  );

  const now = new Date();

  return (
    <div>
      <DashboardPageHeader
        title="Active Olympiads"
        description="Olympiads open for participation."
        breadcrumbs={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Olympiads" },
        ]}
      />

      {published.length === 0 ? (
        <EmptyState
          title="No Olympiads open right now"
          description="Check back soon — new Olympiads will appear here once published."
        />
      ) : (
        <div className="flex flex-col gap-4">
          {published.map((o) => {
            const attemptStatus = attemptByOlympiad.get(o.id);
            const isRegistered = registeredOlympiads.has(o.id);

            const examStarted = o.startAt ? now >= o.startAt : true;
            const examEnded = o.endAt ? now >= o.endAt : false;

            let action: React.ReactNode;

            if (attemptStatus === "in_progress") {
              action = (
                <Button
                  href={`/dashboard/olympiads/${o.id}/attempt`}
                  variant="primary"
                  className="shrink-0 text-xs"
                >
                  Resume
                </Button>
              );
            } else if (
              attemptStatus === "submitted" ||
              attemptStatus === "expired_auto_submitted"
            ) {
              action = <Badge tone="neutral">Attempted</Badge>;
            } else if (isRegistered && examStarted && !examEnded) {
              action = (
                <Button
                  href={`/dashboard/olympiads/${o.id}/attempt`}
                  variant="primary"
                  className="shrink-0 text-xs"
                >
                  Start Exam
                </Button>
              );
            } else if (isRegistered) {
              action = (
                <Button
                  href={`/dashboard/olympiads/${o.id}/attempt`}
                  variant="secondary"
                  className="shrink-0 text-xs"
                >
                  Registered — View Exam
                </Button>
              );
            } else {
              action = (
                <Button
                  href={`/dashboard/olympiads/${o.id}/register`}
                  variant="secondary"
                  className="shrink-0 text-xs"
                >
                  Register
                </Button>
              );
            }

            return (
              <div
                key={o.id}
                className="flex flex-col gap-3 rounded-lg border border-border bg-elevated p-5 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <p className="font-display text-lg text-primary">{o.title}</p>

                  {o.description ? (
                    <p className="mt-1 max-w-lg text-sm text-secondary">
                      {o.description}
                    </p>
                  ) : null}

                  <p className="mt-2 font-mono text-[10px] uppercase tracking-[0.12em] text-muted">
                    {o.durationMinutes} minutes
                    {o.endAt ? ` · Closes ${o.endAt.toLocaleString()}` : ""}
                  </p>
                </div>

                {action}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
