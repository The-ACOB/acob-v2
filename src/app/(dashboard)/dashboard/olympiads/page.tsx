import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
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
    posterUrl: string | null;
    subject: string | null;
    durationMinutes: number;
    startAt: Date | null;
    endAt: Date | null;
  }[] = await db.olympiad.findMany({
    where: { status: "published" },
    orderBy: { createdAt: "desc" },
    take: 50,
    select: {
      id: true,
      title: true,
      description: true,
      posterUrl: true,
      subject: true,
      durationMinutes: true,
      startAt: true,
      endAt: true,
    },
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
              <article
                key={o.id}
                className="flex flex-col sm:flex-row overflow-hidden rounded-lg border border-border bg-elevated transition-all duration-300 hover:border-accent/40"
              >
                {/* Left Thumbnail/Poster */}
                {o.posterUrl ? (
                  <div className="relative sm:w-64 sm:shrink-0 aspect-[16/9] sm:aspect-auto sm:min-h-full bg-black/40 border-b sm:border-b-0 sm:border-r border-border">
                    <Image
                      src={o.posterUrl}
                      alt={o.title}
                      fill
                      sizes="(max-width: 640px) 100vw, 256px"
                      unoptimized
                      className="object-cover"
                    />
                  </div>
                ) : (
                  <div className="sm:w-64 sm:shrink-0 h-28 sm:h-auto border-b sm:border-b-0 sm:border-r border-border bg-gradient-to-br from-neutral-900 to-neutral-950 flex items-center justify-center p-4">
                    <span className="font-mono text-xs uppercase tracking-widest text-muted/60 text-center">
                      {o.subject ?? "ACOB Olympiad"}
                    </span>
                  </div>
                )}

                {/* Right Content Area */}
                <div className="flex flex-1 flex-col justify-between p-6">
                  <div>
                    <h3 className="font-display text-xl text-primary">
                      {o.title}
                    </h3>

                    {o.description ? (
                      <p className="mt-2 text-sm leading-relaxed text-secondary line-clamp-2">
                        {o.description}
                      </p>
                    ) : null}

                    <p className="mt-3 font-mono text-[10px] uppercase tracking-[0.12em] text-muted">
                      {o.durationMinutes} minutes
                      {o.endAt ? ` · Closes ${o.endAt.toLocaleString()}` : ""}
                    </p>
                  </div>

                  <div className="flex items-center justify-between border-t border-border/40 mt-4 pt-4">
                    <span className="font-mono text-xs text-muted">
                      {o.startAt
                        ? `Opens ${o.startAt.toLocaleDateString()}`
                        : "Open now"}
                    </span>
                    {action}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
