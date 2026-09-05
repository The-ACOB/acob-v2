"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { registerForOlympiadAction } from "@/lib/exam/actions";
import { Button } from "@/components/ui/Button";

export function OlympiadRegistrationForm({
  olympiad,
  questionCount,
  registered,
  eligible,
  registrationOpen,
  phase,
}: {
  olympiad: {
    id: string;
    title: string;
    description: string | null;
    durationMinutes: number;
    registrationStartAt: Date | null;
    registrationEndAt: Date | null;
    startAt: Date | null;
    endAt: Date | null;
    eligibilityMode: string;
    eligibilityGradeLevel: string | null;
    eligibilityInstitution: string | null;
    eligibilityAcademicLevel: string | null;
  };
  questionCount: number;
  registered: boolean;
  eligible: boolean;
  registrationOpen: boolean;
  phase: string;
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [confirmed, setConfirmed] = useState(registered);
  const [error, setError] = useState<string | null>(null);
  async function register() {
    setPending(true);
    setError(null);
    const result = await registerForOlympiadAction(olympiad.id);
    setPending(false);
    if (!result.ok) return setError(result.error);
    setConfirmed(true);
    router.refresh();
  }
  return (
    <div className="mx-auto max-w-2xl rounded-lg border border-border bg-elevated p-6">
      <h1 className="font-display text-3xl text-primary">{olympiad.title}</h1>
      <p className="mt-2 font-mono text-xs uppercase tracking-[0.12em] text-accent">
        {phase.replace(/_/g, " ")}
      </p>
      {olympiad.description ? (
        <p className="mt-3 text-secondary">{olympiad.description}</p>
      ) : null}
      <dl className="mt-6 grid grid-cols-2 gap-4 text-sm text-secondary">
        <div>
          <dt className="text-muted">Duration</dt>
          <dd>{olympiad.durationMinutes} minutes</dd>
        </div>
        <div>
          <dt className="text-muted">Questions</dt>
          <dd>{questionCount}</dd>
        </div>
        <div>
          <dt className="text-muted">Registration</dt>
          <dd>
            {olympiad.registrationStartAt?.toLocaleString() ?? "Now"} to{" "}
            {olympiad.registrationEndAt?.toLocaleString() ?? "Exam start"}
          </dd>
        </div>
        <div>
          <dt className="text-muted">Exam</dt>
          <dd>
            {olympiad.startAt?.toLocaleString() ?? "Now"} to{" "}
            {olympiad.endAt?.toLocaleString() ?? "No closing time"}
          </dd>
        </div>
      </dl>
      <p className="mt-6 text-sm text-secondary">
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
      {error ? <p className="mt-4 text-sm text-error">{error}</p> : null}
      {!registrationOpen && !confirmed ? (
        <p className="mt-4 text-sm text-warning">
          Registration is not currently open.
        </p>
      ) : null}
      {confirmed ? (
        <Button
          href={`/dashboard/olympiads/${olympiad.id}/attempt`}
          variant={registrationOpen ? "primary" : "secondary"}
          className="mt-6 text-xs"
        >
          {registrationOpen
            ? "Registered — view exam"
            : "Registered — await exam"}
        </Button>
      ) : (
        <Button
          type="button"
          variant="primary"
          className="mt-6 text-xs"
          disabled={!eligible || !registrationOpen || pending}
          onClick={register}
        >
          {pending
            ? "Registering..."
            : !eligible
              ? "Not eligible"
              : !registrationOpen
                ? "Registration closed"
                : "Confirm Registration"}
        </Button>
      )}
    </div>
  );
}
