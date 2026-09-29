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

export const metadata: Metadata = { title: "Manage Olympiad" };

type AttemptRow = {
  id: string;
  userId: string;
  status: string;
  score: number | null;
  totalMarks: number | null;
  rank: number | null;
  user: { email: string; profile: { fullName: string } | null } | null;
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
    if (err instanceof AuthError) redirect("/dashboard/olympiads");
    throw err;
  }

  const { id } = await params;
  const olympiad = await db.olympiad.findUnique({
    where: { id },
    include: { _count: { select: { registrations: true } } },
  });
  if (!olympiad) notFound();

  const questions: QuestionRow[] = await db.question.findMany({
    where: { olympiadId: id },
    include: {
      options: true,
    },
  });
  const attempts: AttemptRow[] = await db.attempt.findMany({
    where: { olympiadId: id },
    orderBy: { score: "desc" },
    include: {
      user: {
        include: {
          profile: true,
        },
      },
    },
  });
  const registrations = await db.olympiadRegistration.findMany({
    where: { olympiadId: id },
    orderBy: { registeredAt: "asc" },
    include: { user: { include: { profile: true } } },
  });
  const resultRows: RegistrationRow[] = registrations.map((registration) => {
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
      user: registration.user,
    };
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
      cell: (r) => (r.score !== null ? `${r.score} / ${r.totalMarks}` : "—"),
    },
    { header: "Rank", cell: (r) => r.rank ?? "—" },
  ];

  return (
    <div>
      <DashboardPageHeader
        title={olympiad.title}
        breadcrumbs={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Olympiads", href: "/dashboard/olympiads" },
          { label: olympiad.title },
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

        <section>
          <h2 className="mb-4 font-display text-lg text-primary">
            Questions{" "}
            <span className="text-sm text-muted">({questions.length})</span>
          </h2>
          <QuestionsManager olympiadId={id} questions={questions} editable />
        </section>

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
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-border bg-black/20 text-xs font-mono uppercase tracking-wider text-muted">
                    {columns.map((col, idx) => (
                      <th key={idx} className="p-4">
                        {col.header}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/40 text-sm">
                  {resultRows.map((r) => (
                    <tr
                      key={r.id}
                      className="transition-colors hover:bg-white/[0.02]"
                    >
                      {columns.map((col, idx) => (
                        <td key={idx} className="p-4">
                          {col.cell(r)}
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
