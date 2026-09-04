import type { Metadata } from "next";
import { getCurrentSession } from "@/lib/auth/session";
import { db } from "@/lib/db/client";
import { DashboardPageHeader } from "@/components/dashboard/PageHeader";
import { DataTable, type Column } from "@/components/dashboard/DataTable";
import { Badge } from "@/components/ui/Badge";

export const metadata: Metadata = { title: "Results" };

type Row = {
  id: string;
  score: number | null;
  totalMarks: number | null;
  correctCount: number | null;
  incorrectCount: number | null;
  unansweredCount: number | null;
  rank: number | null;
  olympiadTitle: string;
};

export default async function MyResultsPage() {
  const session = await getCurrentSession();
  if (!session) return null;

  const attempts: {
    id: string;
    olympiadId: string;
    score: number | null;
    totalMarks: number | null;
    correctCount: number | null;
    incorrectCount: number | null;
    unansweredCount: number | null;
    rank: number | null;
  }[] = await db.attempt.findMany({ where: { userId: session.id } });

  const rows: Row[] = [];
  for (const a of attempts) {
    const olympiad = await db.olympiad.findUnique({ where: { id: a.olympiadId } });
    // Results are only ever shown once officially published — this is
    // enforced here (the read layer), not just by hiding a button.
    if (!olympiad?.resultsPublishedAt) continue;
    rows.push({
      id: a.id,
      score: a.score,
      totalMarks: a.totalMarks,
      correctCount: a.correctCount,
      incorrectCount: a.incorrectCount,
      unansweredCount: a.unansweredCount,
      rank: a.rank,
      olympiadTitle: olympiad.title,
    });
  }

  const columns: Column<Row>[] = [
    { header: "Olympiad", cell: (r) => <span className="text-primary">{r.olympiadTitle}</span> },
    { header: "Score", cell: (r) => `${r.score} / ${r.totalMarks}` },
    { header: "Correct", cell: (r) => <Badge tone="success">{r.correctCount}</Badge> },
    { header: "Incorrect", cell: (r) => <Badge tone="error">{r.incorrectCount}</Badge> },
    { header: "Unanswered", cell: (r) => <Badge tone="neutral">{r.unansweredCount}</Badge> },
    { header: "Rank", cell: (r) => (r.rank ? `#${r.rank}` : "—") },
  ];

  return (
    <div>
      <DashboardPageHeader title="Results" breadcrumbs={[{ label: "Dashboard", href: "/dashboard" }, { label: "Results" }]} />
      <DataTable
        columns={columns}
        rows={rows}
        getRowId={(r) => r.id}
        emptyTitle="No published results yet"
        emptyDescription="Once an Olympiad you've taken has its results published, they'll appear here."
      />
    </div>
  );
}
