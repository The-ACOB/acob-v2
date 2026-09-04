import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { startAttemptAction, getExamData } from "@/lib/exam/actions";
import { ExamRunner } from "@/components/dashboard/ExamRunner";
import { DashboardPageHeader } from "@/components/dashboard/PageHeader";
import { EmptyState } from "@/components/ui/EmptyState";
import { db } from "@/lib/db/client";

export const metadata: Metadata = { title: "Attempt" };

export default async function AttemptPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const olympiad = await db.olympiad.findUnique({ where: { id } });
  if (!olympiad) notFound();

  const started = await startAttemptAction(id);
  if (!started.ok) {
    return (
      <div>
        <DashboardPageHeader title={olympiad.title} breadcrumbs={[{ label: "Dashboard", href: "/dashboard" }, { label: "Olympiads", href: "/dashboard/olympiads" }, { label: olympiad.title }]} />
        <EmptyState title="This attempt isn't available" description={started.error} />
      </div>
    );
  }

  const data = await getExamData(started.data!.attemptId);
  if (!data.ok) {
    return (
      <div>
        <DashboardPageHeader title={olympiad.title} breadcrumbs={[{ label: "Dashboard", href: "/dashboard" }, { label: "Olympiads", href: "/dashboard/olympiads" }, { label: olympiad.title }]} />
        <EmptyState title="This attempt isn't available" description={data.error} />
      </div>
    );
  }

  return (
    <div>
      <DashboardPageHeader
        title={olympiad.title}
        breadcrumbs={[{ label: "Dashboard", href: "/dashboard" }, { label: "Olympiads", href: "/dashboard/olympiads" }, { label: olympiad.title }]}
      />
      <ExamRunner
        attemptId={data.attempt.id}
        deadlineAt={data.attempt.deadlineAt}
        questions={data.questions}
        initialAnswers={data.existingAnswers}
      />
    </div>
  );
}
