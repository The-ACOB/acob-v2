"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { registerForOlympiadAction } from "@/lib/exam/actions";

export function OlympiadParticipationCta({
  olympiadId,
  phase,
  authenticated,
  registered,
  eligible,
}: {
  olympiadId: string;
  phase:
    | "upcoming"
    | "registration_open"
    | "registration_closed"
    | "live"
    | "closed";
  authenticated: boolean;
  registered: boolean;
  eligible: boolean;
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const returnTo = `/olympiads/${olympiadId}`;
  const loginUrl = `/login?returnTo=${encodeURIComponent(returnTo)}`;
  const registerUrl = `/register?returnTo=${encodeURIComponent(returnTo)}`;

  async function register() {
    setPending(true);
    setError(null);
    const result = await registerForOlympiadAction(olympiadId);
    setPending(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    router.refresh();
  }

  if (phase === "upcoming") {
    return (
      <p className="text-sm text-secondary">Registration is not open yet.</p>
    );
  }
  if (phase === "registration_closed" || phase === "closed") {
    return (
      <div className="flex flex-col gap-2 text-sm text-secondary">
        <span>
          {registered
            ? "You are registered. Your exam will be available at the scheduled time."
            : "Registration is closed."}
        </span>
      </div>
    );
  }
  if (phase === "live") {
    if (!registered)
      return (
        <p className="text-sm text-secondary">
          Registration is closed. Only registered participants can take this
          exam.
        </p>
      );
    if (!eligible)
      return (
        <p className="text-sm text-warning">
          You are not eligible to participate in this Olympiad.
        </p>
      );
    return (
      <Button
        href={`/dashboard/olympiads/${olympiadId}/attempt`}
        variant="primary"
      >
        Start Exam
      </Button>
    );
  }
  if (!authenticated) {
    return (
      <div className="flex flex-wrap gap-3">
        <Button href={loginUrl} variant="primary">
          Register / Participate
        </Button>
        <Button href={registerUrl} variant="secondary">
          Create account
        </Button>
      </div>
    );
  }
  if (registered)
    return (
      <p className="text-sm text-success">
        You are registered for this Olympiad.
      </p>
    );
  return (
    <div className="flex flex-col items-start gap-2">
      <Button
        type="button"
        variant="primary"
        disabled={pending || !eligible}
        onClick={register}
      >
        {pending
          ? "Registering..."
          : eligible
            ? "Register / Participate"
            : "Not eligible"}
      </Button>
      {error ? <p className="text-sm text-error">{error}</p> : null}
    </div>
  );
}
