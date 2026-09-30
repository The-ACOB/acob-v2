import type { Metadata } from "next";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { requirePermission, AuthError } from "@/lib/authz/guards";
import { db } from "@/lib/db/client";
import { DashboardPageHeader } from "@/components/dashboard/PageHeader";
import {
  QuestionsManager,
  type QuestionRow,
} from "@/components/dashboard/QuestionsManager";
import { OlympiadPublishControls } from "@/components/dashboard/OlympiadPublishControls";
import { type Column } from "@/components/dashboard/DataTable";
import { Badge } from "@/components/ui/Badge";
import { getOlympiadPhase } from "@/lib/olympiads/lifecycle";
import {
  ManualRankingEditor,
  type ManualRankingRow,
} from "@/components/dashboard/ManualRankingEditor";

export const metadata: Metadata = {
  title: "Manage Olympiad",
};

type AttemptRow = {
  id: string;
  userId: string;
  status: string;
  score: number | null;
  totalMarks: number | null;
  rank: number | null;
  manualRank: number | null;
  user: {
    email: string;
    profile: {
      fullName: string;
    } | null;
  } | null;
};

type RegistrationRow = AttemptRow & {
  registeredAt: Date;
  attemptId: string | null;
};

export default async function OlympiadDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  try {
    await requirePermission("olympiad:update");
  } catch (err) {
    if (err instanceof AuthError) {
      redirect("/dashboard/olympiads");
    }

    throw err;
  }

  const { id } = await params;

  const olympiad = await db.olympiad.findUnique({
    where: { id },
    include: {
      _count: {
        select: {
          registrations: true,
        },
      },
    },
  });

  if (!olympiad) {
    notFound();
  }

  const [questions, archiveSubjects, archiveFolders] = await Promise.all([
    db.question.findMany({
      where: { olympiadId: id },
      include: { options: true },
      orderBy: { order: "asc" },
    }),
    db.questionArchiveSubject.findMany({
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
    db.questionArchiveFolder.findMany({
      orderBy: { name: "asc" },
      select: { id: true, subjectId: true, parentId: true, name: true },
    }),
  ]);

  const attempts: AttemptRow[] = await db.attempt.findMany({
    where: {
      olympiadId: id,
    },
    orderBy: [
      {
        rank: "asc",
      },
      {
        score: "desc",
      },
    ],
    include: {
      user: {
        include: {
          profile: true,
        },
      },
    },
  });

  const registrations = await db.olympiadRegistration.findMany({
    where: {
      olympiadId: id,
    },
    orderBy: {
      registeredAt: "asc",
    },
    include: {
      user: {
        include: {
          profile: true,
        },
      },
    },
  });

  const resultRows: RegistrationRow[] = registrations
    .map((registration) => {
      const attempt = attempts.find(
        (candidate) => candidate.userId === registration.userId,
      );

      return {
        id: attempt?.id ?? registration.id,
        userId: registration.userId,
        attemptId: attempt?.id ?? null,
        registeredAt: registration.registeredAt,
        status: attempt?.status ?? "registered",
        score: attempt?.score ?? null,
        totalMarks: attempt?.totalMarks ?? null,
        rank: attempt?.rank ?? null,
        manualRank: attempt?.manualRank ?? null,
        user: registration.user,
      };
    })
    .sort((a, b) => {
      /*
       * Ranked participants first.
       * The actual rank is authoritative.
       * Score is only used as a fallback for participants
       * who do not yet have a rank.
       */
      if (a.rank !== null && b.rank !== null) {
        return a.rank - b.rank;
      }

      if (a.rank !== null) {
        return -1;
      }

      if (b.rank !== null) {
        return 1;
      }

      if (a.score !== null && b.score !== null) {
        return b.score - a.score;
      }

      return 0;
    });

  const attemptedCount = resultRows.filter(
    (row) => row.attemptId !== null,
  ).length;

  const submittedCount = resultRows.filter(
    (row) =>
      row.status === "submitted" || row.status === "expired_auto_submitted",
  ).length;

  const resultsPublished = Boolean(olympiad.resultsPublishedAt);
  const phase = getOlympiadPhase(olympiad);

  /*
   * This is the list used by the manual ranking editor.
   *
   * IMPORTANT:
   * If a manual ranking already exists, rank is used first.
   * Otherwise we fall back to score.
   */
  const provisionalRankedRows = resultRows
    .filter(
      (row) =>
        row.attemptId !== null &&
        (row.status === "submitted" || row.status === "expired_auto_submitted"),
    )
    .sort((a, b) => {
      if (a.rank !== null && b.rank !== null) {
        return a.rank - b.rank;
      }

      if (a.rank !== null) {
        return -1;
      }

      if (b.rank !== null) {
        return 1;
      }

      return (b.score ?? 0) - (a.score ?? 0);
    });

  const columns: Column<RegistrationRow>[] = [
    {
      header: "Participant",
      cell: (r) => (
        <span className="text-primary">
          {r.user?.profile?.fullName ?? r.user?.email ?? "Unknown"}
        </span>
      ),
    },
    {
      header: "Attempt status",
      cell: (r) => (
        <Badge
          tone={
            r.status === "in_progress"
              ? "warning"
              : r.status === "registered"
                ? "neutral"
                : "success"
          }
        >
          {r.status === "registered"
            ? "Not started"
            : r.status === "expired_auto_submitted"
              ? "Auto-submitted"
              : r.status.replace(/_/g, " ")}
        </Badge>
      ),
    },
    {
      header: "Score",
      cell: (r) =>
        r.score !== null ? `${r.score} / ${r.totalMarks ?? "—"}` : "—",
    },
    {
      header: "Rank",
      cell: (r) => r.rank ?? "—",
    },
  ];

  return (
    <div>
      <DashboardPageHeader
        title={olympiad.title}
        breadcrumbs={[
          {
            label: "Dashboard",
            href: "/dashboard",
          },
          {
            label: "Olympiads",
            href: "/dashboard/olympiads",
          },
          {
            label: olympiad.title,
          },
        ]}
        actions={
          <div className="flex items-center gap-3">
            <Badge
              tone={olympiad.status === "published" ? "success" : "neutral"}
            >
              {olympiad.status}
            </Badge>

            <Link
              href={`/dashboard/olympiads/${id}/edit`}
              className="text-xs text-accent underline underline-offset-4"
            >
              Edit settings
            </Link>
          </div>
        }
      />

      <div className="flex flex-col gap-12">
        {/* PUBLICATION */}
        <section>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-display text-lg text-primary">Publication</h2>
          </div>

          <OlympiadPublishControls
            olympiadId={id}
            status={olympiad.status}
            resultsPublished={resultsPublished}
            hasAttempts={attempts.length > 0}
            registrationEnabled={olympiad.registrationEnabled}
            finished={phase === "closed"}
          />

          <p className="mt-3 text-sm text-secondary">
            Current phase:{" "}
            <span className="font-medium text-primary">
              {phase.replace(/_/g, " ")}
            </span>
          </p>

          <div className="mt-3 text-sm text-secondary">
            <p>
              Registration:{" "}
              {olympiad.registrationStartAt?.toLocaleString() ?? "Now"} to{" "}
              {olympiad.registrationEndAt?.toLocaleString() ?? "Exam start"}
            </p>

            <p>
              Exam: {olympiad.startAt?.toLocaleString() ?? "Now"} to{" "}
              {olympiad.endAt?.toLocaleString() ?? "No closing time"}
            </p>
          </div>

          {olympiad.publishAt && olympiad.status === "draft" ? (
            <p className="mt-3 text-xs text-muted">
              Scheduled to publish {olympiad.publishAt.toLocaleString()}.
            </p>
          ) : null}

          {questions.length === 0 ? (
            <p className="mt-3 text-sm text-warning">
              This Olympiad has no questions yet. Students will not be able to
              start the exam until questions are added.
            </p>
          ) : null}
        </section>

        {/* MANUAL RANKING */}
        <ManualRankingEditor
          olympiadId={id}
          published={resultsPublished}
          rows={provisionalRankedRows.map(
            (row, index): ManualRankingRow => ({
              id: row.attemptId!,
              name: row.user?.profile?.fullName ?? row.user?.email ?? "Unknown",
              email: row.user?.email ?? "",
              score: row.score,
              totalMarks: row.totalMarks,

              /*
               * Use the database rank when available.
               * Before ranking exists, use the provisional index.
               */
              rank: row.rank ?? index + 1,

              manualRank: row.manualRank,
            }),
          )}
        />

        {/* QUESTIONS */}
        <section>
          <h2 className="mb-4 font-display text-lg text-primary">
            Questions{" "}
            <span className="text-sm text-muted">({questions.length})</span>
          </h2>

          <QuestionsManager
            olympiadId={id}
            olympiadSubject={olympiad.subject}
            questions={questions}
            archiveSubjects={archiveSubjects}
            archiveFolders={archiveFolders}
            editable
          />
        </section>

        {/* PARTICIPANTS + RESULTS */}
        <section>
          <h2 className="mb-4 font-display text-lg text-primary">
            Participants & Results
          </h2>

          <p className="mb-4 text-sm text-secondary">
            {registrations.length} registered, {attemptedCount} attempted,{" "}
            {submittedCount} submitted
          </p>

          {resultRows.length === 0 ? (
            <div className="rounded-lg border border-border bg-elevated p-8 text-center">
              <h3 className="font-display text-base text-primary">
                No attempts yet
              </h3>

              <p className="mt-1 text-sm text-secondary">
                Once participants start this Olympiad, their attempts will
                appear here.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-lg border border-border bg-elevated">
              <table className="w-full border-collapse text-left">
                <thead>
                  <tr className="border-b border-border bg-black/20 text-xs font-mono uppercase tracking-wider text-muted">
                    {columns.map((column, index) => (
                      <th key={index} className="p-4">
                        {column.header}
                      </th>
                    ))}
                  </tr>
                </thead>

                <tbody className="divide-y divide-border/40 text-sm">
                  {resultRows.map((row) => (
                    <tr
                      key={row.id}
                      className="transition-colors hover:bg-white/[0.02]"
                    >
                      {columns.map((column, index) => (
                        <td key={index} className="p-4">
                          {column.cell(row)}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
