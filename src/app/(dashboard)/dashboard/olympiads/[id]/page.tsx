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
import { DataTable, type Column } from "@/components/dashboard/DataTable";
import { Badge } from "@/components/ui/Badge";

export const metadata: Metadata = { title: "Manage Olympiad" };

type AttemptRow = {
  id: string;
  status: string;
  score: number | null;
  totalMarks: number | null;
  rank: number | null;
  user: { email: string; profile: { fullName: string } | null } | null;
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
  const olympiad = await db.olympiad.findUnique({ where: { id } });
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

  const resultsPublished = Boolean(olympiad.resultsPublishedAt);

  const columns: Column<AttemptRow>[] = [
    {
      header: "Participant",
      cell: (r) => (
        <span className="text-primary">
          {r.user?.profile?.fullName ?? r.user?.email ?? "Unknown"}
        </span>
      ),
    },
    {
      header: "Status",
      cell: (r) => (
        <Badge tone={r.status === "in_progress" ? "warning" : "neutral"}>
          {r.status.replace(/_/g, " ")}
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
          />
          {olympiad.publishAt && olympiad.status === "draft" ? (
            <p className="mt-3 text-xs text-muted">
              Scheduled to publish {olympiad.publishAt.toLocaleString()}.
            </p>
          ) : null}
        </section>

        <section>
          <h2 className="mb-4 font-display text-lg text-primary">
            Questions{" "}
            <span className="text-sm text-muted">({questions.length})</span>
          </h2>
          <QuestionsManager
            olympiadId={id}
            questions={questions}
            editable={olympiad.status !== "published"}
          />
        </section>

        <section>
          <h2 className="mb-4 font-display text-lg text-primary">
            Participants & Results
          </h2>
          <DataTable
            columns={columns}
            rows={attempts}
            getRowId={(r) => r.id}
            emptyTitle="No attempts yet"
            emptyDescription="Once participants start this Olympiad, their attempts will appear here."
          />
        </section>
      </div>
    </div>
  );
}
