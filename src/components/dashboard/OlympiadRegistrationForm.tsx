"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { registerForOlympiadAction } from "@/lib/exam/actions";
import { Button } from "@/components/ui/Button";

function formatDate(date: Date | null, fallback: string) {
  if (!date) return fallback;
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(date);
}

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
    posterUrl: string | null;
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
    <div className="mx-auto max-w-2xl rounded-lg border border-border bg-elevated p-6 sm:p-8">
      <h1 className="font-display text-3xl text-primary">{olympiad.title}</h1>

      <p className="mt-2 font-mono text-xs uppercase tracking-[0.12em] text-accent">
        {phase.replace(/_/g, " ")}
      </p>

      {/* Poster Banner embedded inside the card with full aspect containment */}
      {olympiad.posterUrl ? (
        <div className="relative w-full aspect-[16/9] rounded-md border border-border/60 bg-black/40 overflow-hidden my-5">
          <Image
            src={olympiad.posterUrl}
            alt={olympiad.title}
            fill
            sizes="(max-width: 672px) 100vw, 672px"
            unoptimized
            className="object-contain"
          />
        </div>
      ) : null}

      {olympiad.description ? (
        <p className="mt-3 text-secondary leading-relaxed">
          {olympiad.description}
        </p>
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
          <dd className="text-xs sm:text-sm mt-0.5">
            {formatDate(olympiad.registrationStartAt, "Now")} —{" "}
            {formatDate(olympiad.registrationEndAt, "Exam start")}
          </dd>
        </div>
        <div>
          <dt className="text-muted">Exam Window</dt>
          <dd className="text-xs sm:text-sm mt-0.5">
            {formatDate(olympiad.startAt, "Now")} —{" "}
            {formatDate(olympiad.endAt, "No close time")}
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
