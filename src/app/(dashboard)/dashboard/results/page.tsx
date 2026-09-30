import type { Metadata } from "next";
import Link from "next/link";
import { getCurrentSession } from "@/lib/auth/session";
import { hasPermission } from "@/lib/authz/guards";
import { db } from "@/lib/db/client";
import {
  awardForRank,
  finalizeOlympiadResults,
  isOlympiadFinished,
} from "@/lib/olympiads/results";
import { DashboardPageHeader } from "@/components/dashboard/PageHeader";
import { DataTable, type Column } from "@/components/dashboard/DataTable";
import { Badge } from "@/components/ui/Badge";

export const metadata: Metadata = { title: "Results & Rankings" };

type OlympiadRow = {
  id: string;
  title: string;
  subject: string | null;
  endAt: Date | null;
  resultsPublishedAt: Date | null;
  participantCount: number;
  rankedCount: number;
};

async function StaffResultsIndex() {
  // Finalise every completed Olympiad before building the index. The result
  // engine is scoped by olympiadId, so Junior and Senior can never be merged.
  const completed = await db.olympiad.findMany({
    where: {
      OR: [
        { resultsPublishedAt: { not: null } },
        { endAt: { lte: new Date() } },
      ],
    },
    select: { id: true, endAt: true },
  });

  await Promise.all(
    completed
      .filter((olympiad) => isOlympiadFinished(olympiad.endAt))
      .map((olympiad) => finalizeOlympiadResults(olympiad.id)),
  );

  const olympiads = await db.olympiad.findMany({
    where: {
      OR: [
        { resultsPublishedAt: { not: null } },
        { endAt: { lte: new Date() } },
      ],
    },
    orderBy: [{ endAt: "desc" }, { createdAt: "desc" }],
    include: {
      _count: { select: { registrations: true } },
      attempts: {
        where: { rank: { not: null } },
        select: { id: true },
      },
    },
  });

  const rows: OlympiadRow[] = olympiads.map((olympiad) => ({
    id: olympiad.id,
    title: olympiad.title,
    subject: olympiad.subject,
    endAt: olympiad.endAt,
    resultsPublishedAt: olympiad.resultsPublishedAt,
    participantCount: olympiad._count.registrations,
    rankedCount: olympiad.attempts.length,
  }));

  const columns: Column<OlympiadRow>[] = [
    {
      header: "Olympiad",
      cell: (r) => (
        <div>
          <Link
            href={`/dashboard/results/${r.id}`}
            className="font-medium text-primary underline-offset-4 hover:underline"
          >
            {r.title}
          </Link>
          {r.subject ? (
            <p className="mt-1 text-xs text-muted">{r.subject}</p>
          ) : null}
        </div>
      ),
    },
    {
      header: "Participants",
      cell: (r) => `${r.rankedCount} ranked / ${r.participantCount} registered`,
    },
    {
      header: "Finished",
      cell: (r) =>
        r.endAt ? r.endAt.toLocaleDateString() : "Completion recorded",
    },
    {
      header: "Status",
      cell: (r) => (
        <Badge tone="success">
          {r.resultsPublishedAt ? "Published" : "Finalised"}
        </Badge>
      ),
    },
    {
      header: "Actions",
      cell: (r) => (
        <Link
          href={`/dashboard/results/${r.id}`}
          className="text-xs font-medium text-accent underline underline-offset-4"
        >
          View winners
        </Link>
      ),
    },
  ];

  return (
    <div>
      <DashboardPageHeader
        title="Results & Rankings"
        description="Every completed Olympiad has its own independent ranking and recognition list."
        breadcrumbs={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Results & Rankings" },
        ]}
      />

      <DataTable
        columns={columns}
        rows={rows}
        getRowId={(r) => r.id}
        emptyTitle="No completed Olympiads yet"
        emptyDescription="Once an Olympiad finishes, its rankings will appear here automatically."
      />
    </div>
  );
}

async function PersonalResults() {
  const session = await getCurrentSession();
  if (!session) return null;

  const attempts = await db.attempt.findMany({
    where: { userId: session.id },
    include: { olympiad: true },
    orderBy: { createdAt: "desc" },
  });

  // Finalise completed Olympiads lazily so a participant can see their
  // position without an administrator having to open the rankings page first.
  await Promise.all(
    attempts
      .filter((attempt) => isOlympiadFinished(attempt.olympiad.endAt))
      .map((attempt) => finalizeOlympiadResults(attempt.olympiadId)),
  );

  const refreshedAttempts = await db.attempt.findMany({
    where: {
      userId: session.id,
      rank: { not: null },
      status: { in: ["submitted", "expired_auto_submitted"] },
      olympiad: { resultsPublishedAt: { not: null } },
    },
    include: { olympiad: true },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div>
      <DashboardPageHeader
        title="My Results"
        description="Your published Olympiad results and recognition. Only your own results are shown here."
        breadcrumbs={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "My Results" },
        ]}
      />

      {refreshedAttempts.length === 0 ? (
        <div className="border border-dashed border-border-strong bg-elevated/40 px-6 py-10 sm:px-10">
          <h2 className="font-display text-xl text-primary">
            No published results yet
          </h2>
          <p className="mt-2 max-w-xl text-sm leading-6 text-secondary">
            Results will appear here after an Olympiad you completed has been
            finalised and published by ACOB. Registrations without an exam
            attempt and disqualified attempts receive no result or recognition.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {refreshedAttempts.map((attempt) => {
            const award = awardForRank(attempt.rank);
            const awardTone =
              attempt.rank !== null && attempt.rank <= 3
                ? "success"
                : "neutral";

            return (
              <article
                key={attempt.id}
                className="border border-border bg-elevated p-5 sm:p-6"
              >
                <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted">
                      Published result
                    </p>
                    <h2 className="mt-2 font-display text-xl text-primary">
                      {attempt.olympiad.title}
                    </h2>
                    <p className="mt-1 text-sm text-secondary">
                      Your final result for this Olympiad.
                    </p>
                  </div>

                  <Badge tone={awardTone} className="w-fit">
                    {award ?? "No recognition"}
                  </Badge>
                </div>

                <div className="mt-5 grid grid-cols-2 border-l border-t border-border sm:grid-cols-4">
                  <div className="border-b border-r border-border px-4 py-3">
                    <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-muted">
                      Position
                    </p>
                    <p className="mt-1 font-display text-2xl text-primary">
                      #{attempt.rank}
                    </p>
                  </div>
                  <div className="border-b border-r border-border px-4 py-3">
                    <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-muted">
                      Score
                    </p>
                    <p className="mt-1 font-mono text-lg tabular-nums text-primary">
                      {attempt.score ?? "—"} / {attempt.totalMarks ?? "—"}
                    </p>
                  </div>
                  <div className="border-b border-r border-border px-4 py-3">
                    <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-muted">
                      Correct
                    </p>
                    <p className="mt-1 font-mono text-lg tabular-nums text-primary">
                      {attempt.correctCount ?? "—"}
                    </p>
                  </div>
                  <div className="border-b border-r border-border px-4 py-3">
                    <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-muted">
                      Incorrect
                    </p>
                    <p className="mt-1 font-mono text-lg tabular-nums text-primary">
                      {attempt.incorrectCount ?? "—"}
                    </p>
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

export default async function ResultsPage() {
  const canViewAllResults = await hasPermission("olympiad:results:view");
  return canViewAllResults ? <StaffResultsIndex /> : <PersonalResults />;
}
