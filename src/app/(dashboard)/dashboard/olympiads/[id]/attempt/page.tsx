import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getExamData } from "@/lib/exam/actions";
import { getCurrentSession } from "@/lib/auth/session";
import { isEligibleForOlympiad } from "@/lib/exam/eligibility";
import { OlympiadStartConfirmation } from "@/components/dashboard/OlympiadStartConfirmation";
import { ExamRunner } from "@/components/dashboard/ExamRunner";
import { DashboardPageHeader } from "@/components/dashboard/PageHeader";
import { EmptyState } from "@/components/ui/EmptyState";
import { db } from "@/lib/db/client";

export const metadata: Metadata = { title: "Attempt" };

export default async function AttemptPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ attemptId?: string }>;
}) {
  const { id } = await params;
  const { attemptId } = await searchParams;
  const session = await getCurrentSession();
  if (!session) notFound();
  const olympiad = await db.olympiad.findUnique({
    where: { id },
    include: { questions: { select: { marks: true } } },
  });
  if (!olympiad) notFound();

  if (!attemptId) {
    const registration = await db.olympiadRegistration.findUnique({
      where: { olympiadId_userId: { olympiadId: id, userId: session.id } },
    });
    const eligible = await isEligibleForOlympiad(olympiad, session.id);
    if (!registration || !eligible)
      return (
        <EmptyState
          title="This Olympiad isn't available"
          description={
            !registration
              ? "Register before starting this Olympiad."
              : "You are not eligible to attempt this Olympiad."
          }
        />
      );
    return (
      <OlympiadStartConfirmation
        olympiad={olympiad}
        questionCount={olympiad.questions.length}
        totalMarks={olympiad.questions.reduce(
          (sum, question) => sum + question.marks,
          0,
        )}
        eligible={eligible}
      />
    );
  }

  const data = await getExamData(attemptId);
  if (!data.ok) {
    return (
      <div>
        <DashboardPageHeader
          title={olympiad.title}
          breadcrumbs={[
            { label: "Dashboard", href: "/dashboard" },
            { label: "Olympiads", href: "/dashboard/olympiads" },
            { label: olympiad.title },
          ]}
        />
        <EmptyState
          title="This attempt isn't available"
          description={data.error}
        />
      </div>
    );
  }

  return (
    <div>
      <DashboardPageHeader
        title={olympiad.title}
        breadcrumbs={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Olympiads", href: "/dashboard/olympiads" },
          { label: olympiad.title },
        ]}
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
