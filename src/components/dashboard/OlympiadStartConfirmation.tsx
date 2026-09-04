"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { startAttemptAction } from "@/lib/exam/actions";
import { Button } from "@/components/ui/Button";

export function OlympiadStartConfirmation({
  olympiad,
  questionCount,
  totalMarks,
  eligible,
}: {
  olympiad: {
    id: string;
    title: string;
    description: string | null;
    durationMinutes: number;
    startAt: Date | null;
    endAt: Date | null;
    negativeMarkingEnabled: boolean;
    negativeMarkingValue: number;
    eligibilityMode: string;
    eligibilityGradeLevel: string | null;
    eligibilityInstitution: string | null;
    eligibilityAcademicLevel: string | null;
  };
  questionCount: number;
  totalMarks: number;
  eligible: boolean;
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  async function confirm() {
    setPending(true);
    setError(null);
    const result = await startAttemptAction(olympiad.id);
    if (!result.ok) {
      setError(result.error);
      setPending(false);
      return;
    }
    router.replace(
      `/dashboard/olympiads/${olympiad.id}/attempt?attemptId=${result.data?.attemptId}`,
    );
  }
  return (
    <div className="mx-auto max-w-3xl rounded-lg border border-border bg-elevated p-6">
      <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted">
        Before you begin
      </p>
      <h1 className="mt-3 font-display text-3xl text-primary">
        {olympiad.title}
      </h1>
      {olympiad.description ? (
        <p className="mt-3 text-secondary">{olympiad.description}</p>
      ) : null}
      <dl className="mt-6 grid grid-cols-2 gap-4 text-sm text-secondary sm:grid-cols-4">
        <div>
          <dt className="text-muted">Duration</dt>
          <dd>{olympiad.durationMinutes} minutes</dd>
        </div>
        <div>
          <dt className="text-muted">Questions</dt>
          <dd>{questionCount}</dd>
        </div>
        <div>
          <dt className="text-muted">Total marks</dt>
          <dd>{totalMarks}</dd>
        </div>
        <div>
          <dt className="text-muted">Schedule</dt>
          <dd>{olympiad.startAt?.toLocaleString() ?? "Open now"}</dd>
        </div>
      </dl>
      <div className="mt-6 border-t border-border pt-5 text-sm text-secondary">
        <p>
          Eligibility:{" "}
          {olympiad.eligibilityMode === "open"
            ? "Open to all participants"
            : [
                olympiad.eligibilityGradeLevel,
                olympiad.eligibilityInstitution,
                olympiad.eligibilityAcademicLevel,
              ]
                .filter(Boolean)
                .join(" / ") || "Configured criteria"}
        </p>
        <p className="mt-2">
          Marking:{" "}
          {olympiad.negativeMarkingEnabled
            ? `Wrong answers lose ${olympiad.negativeMarkingValue} marks.`
            : "No negative marking."}
        </p>
        <p className="mt-2">
          Your registration is confirmed. This is an individual attempt; one
          attempt is allowed.
        </p>
      </div>
      <p className="mt-6 rounded-md border border-warning/40 bg-warning/5 p-4 text-sm text-warning">
        Starting begins the timer immediately. Your attempt cannot be restarted
        once it begins.
      </p>
      {error ? <p className="mt-4 text-sm text-error">{error}</p> : null}
      <div className="mt-6 flex flex-wrap gap-3">
        <Button href="/dashboard/olympiads" variant="ghost" className="text-xs">
          Cancel
        </Button>
        <Button
          type="button"
          variant="primary"
          disabled={!eligible || pending}
          onClick={confirm}
          className="text-xs"
        >
          {pending ? "Starting..." : "Confirm & Start Olympiad"}
        </Button>
      </div>
    </div>
  );
}
