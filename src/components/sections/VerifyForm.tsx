"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { MetadataLabel } from "@/components/ui/MetadataLabel";
import { fieldClasses } from "@/components/ui/FormField";
import { verifyCertificateAction, type VerifyResult } from "@/lib/certificates/actions";

const ACHIEVEMENT_LABELS: Record<string, string> = {
  prime: "Prime",
  elite: "Elite",
  merit: "Merit",
  honourable_mention: "Honourable Mention",
  participation: "Participation",
};

/**
 * Certificate verification. Deliberately shows the same "not verified"
 * state for a nonexistent ID, a malformed ID, and a revoked
 * certificate — never confirming or denying which case it was, so the
 * form can't be used to enumerate real certificate IDs.
 */
export function VerifyForm({ initialToken }: { initialToken?: string }) {
  const [certId, setCertId] = useState("");
  const [result, setResult] = useState<VerifyResult | null>(null);
  const [checking, setChecking] = useState(() => Boolean(initialToken));

  async function runVerification(input: { certificateId?: string; token?: string }) {
    setChecking(true);
    const r = await verifyCertificateAction(input);
    setChecking(false);
    setResult(r);
  }

  useEffect(() => {
    if (!initialToken) return;
    let cancelled = false;
    verifyCertificateAction({ token: initialToken }).then((r) => {
      if (!cancelled) {
        setChecking(false);
        setResult(r);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [initialToken]);

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!certId.trim()) return;
    void runVerification({ certificateId: certId.trim() });
  }

  return (
    <div className="flex flex-col gap-10">
      <form onSubmit={onSubmit} className="flex flex-col gap-4 sm:flex-row">
        <label htmlFor="certId" className="sr-only">
          Certificate ID
        </label>
        <input
          id="certId"
          type="text"
          value={certId}
          onChange={(e) => setCertId(e.target.value)}
          placeholder="e.g. ACOB-2026-7F3K9Q"
          className={`${fieldClasses} font-mono sm:flex-1`}
        />
        <Button type="submit" variant="primary" disabled={checking} className="sm:w-fit">
          {checking ? "Checking…" : "Verify"}
        </Button>
      </form>

      {result ? (
        result.verified ? (
          <div className="rounded-lg border border-success/30 bg-success/5 px-6 py-8 sm:px-8">
            <div className="mb-6 flex items-center gap-3">
              <CheckCircle2 className="h-5 w-5 text-success" strokeWidth={1.75} />
              <MetadataLabel className="text-success">Verified</MetadataLabel>
            </div>
            <dl className="flex flex-col divide-y divide-border">
              <Row label="Certificate holder" value={result.holderName} />
              <Row label="Olympiad" value={result.olympiadTitle} />
              <Row label="Achievement" value={ACHIEVEMENT_LABELS[result.achievement] ?? result.achievement} />
              <Row label="Issue date" value={new Date(result.issuedAt).toLocaleDateString()} />
              <Row label="Certificate ID" value={result.certificateId} mono />
            </dl>
          </div>
        ) : (
          <div className="rounded-lg border border-border-strong bg-elevated px-6 py-10 text-center sm:px-8">
            <XCircle className="mx-auto h-6 w-6 text-muted" strokeWidth={1.5} />
            <p className="mt-4 font-display text-xl text-primary">Not verified</p>
            <p className="mx-auto mt-2 max-w-sm text-sm text-secondary">
              This certificate ID couldn&apos;t be verified. Double-check the ID and try again, or contact ACOB if you believe this is an error.
            </p>
          </div>
        )
      ) : null}
    </div>
  );
}

function Row({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-center justify-between py-4">
      <dt className="text-sm text-secondary">{label}</dt>
      <dd className={`text-sm text-primary ${mono ? "font-mono" : ""}`}>{value}</dd>
    </div>
  );
}
