"use client";

import { useState } from "react";
import Link from "next/link";
import { registerForOlympiadAction } from "@/lib/exam/actions";
import { submitOlympiadPaymentAction } from "@/lib/payments/actions";

const BKASH_NUMBER = "+880 1302-307399";

type RegistrationStatus =
  | "pending_payment"
  | "pending_approval"
  | "confirmed"
  | "rejected"
  | null;

type PaymentStatus = "pending" | "approved" | "rejected" | null;

type Props = {
  olympiad: {
    id: string;
    title: string;
    description: string | null;
    posterUrl: string | null;
    durationMinutes: number;
    registrationType: "free" | "paid";
    registrationFee: string | number | null;
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
  registrationStatus: RegistrationStatus;
  latestPaymentStatus: PaymentStatus;
  eligible: boolean;
  registrationOpen: boolean;
  phase: string;
};

export function OlympiadRegistrationForm({
  olympiad,
  questionCount,
  registered,
  registrationStatus,
  latestPaymentStatus,
  eligible,
  registrationOpen,
  phase,
}: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [senderNumber, setSenderNumber] = useState("");
  const [transactionId, setTransactionId] = useState("");

  const isPaid = olympiad.registrationType === "paid";

  const fee =
    olympiad.registrationFee !== null && olympiad.registrationFee !== undefined
      ? Number(olympiad.registrationFee)
      : 0;

  async function handleFreeRegistration() {
    setLoading(true);
    setError("");
    setSuccess("");

    const result = await registerForOlympiadAction(olympiad.id);

    setLoading(false);

    if (!result.ok) {
      setError(result.error ?? "Registration failed.");
      return;
    }

    setSuccess("You are successfully registered for this Olympiad.");

    window.location.reload();
  }

  async function handlePaymentSubmission(
    event: React.FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    setLoading(true);
    setError("");
    setSuccess("");

    const result = await submitOlympiadPaymentAction(olympiad.id, {
      senderNumber,
      transactionId,
    });

    setLoading(false);

    if (!result.ok) {
      setError(result.error ?? "Payment submission failed.");
      return;
    }

    setSuccess(
      "Payment submitted successfully. Your registration is now waiting for admin confirmation.",
    );

    setSenderNumber("");
    setTransactionId("");

    window.location.reload();
  }

  if (!eligible) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-6">
        <h2 className="text-lg font-semibold text-red-900">
          You are not eligible
        </h2>

        <p className="mt-2 text-sm text-red-700">
          Your profile does not currently meet the eligibility requirements for
          this Olympiad.
        </p>
      </div>
    );
  }

  if (!registrationOpen && registrationStatus !== "confirmed") {
    return (
      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6">
        <h2 className="text-lg font-semibold text-amber-900">
          Registration is currently closed
        </h2>

        <p className="mt-2 text-sm text-amber-700">
          Registration for this Olympiad is not currently accepting new
          registrations.
        </p>
      </div>
    );
  }

  if (registrationStatus === "confirmed") {
    return (
      <div className="space-y-6">
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-6">
          <div className="flex items-start gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-sm font-bold text-white">
              ✓
            </div>

            <div>
              <h2 className="text-lg font-semibold text-emerald-900">
                Registration confirmed
              </h2>

              <p className="mt-1 text-sm text-emerald-700">
                You are registered for this Olympiad and can participate when
                the examination becomes available.
              </p>
            </div>
          </div>
        </div>

        {phase === "live" && (
          <Link
            href={`/dashboard/olympiads/${olympiad.id}/attempt`}
            className="block rounded-xl bg-black px-5 py-3 text-center text-sm font-semibold text-white transition hover:bg-zinc-800"
          >
            Start Olympiad
          </Link>
        )}
      </div>
    );
  }

  if (
    registrationStatus === "pending_approval" ||
    latestPaymentStatus === "pending"
  ) {
    return (
      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6">
        <div className="flex items-start gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-amber-500 text-sm font-bold text-white">
            …
          </div>

          <div>
            <h2 className="text-lg font-semibold text-amber-900">
              Registration pending
            </h2>

            <p className="mt-2 text-sm leading-6 text-amber-800">
              Your payment details have been submitted and are waiting to be
              confirmed by an admin.
            </p>

            <p className="mt-2 text-sm text-amber-800">
              You will be able to participate once your payment is approved.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (registrationStatus === "rejected") {
    return (
      <div className="space-y-5">
        <div className="rounded-2xl border border-red-200 bg-red-50 p-6">
          <h2 className="text-lg font-semibold text-red-900">
            Payment was not approved
          </h2>

          <p className="mt-2 text-sm leading-6 text-red-700">
            Your previous payment submission could not be confirmed. You may
            submit the payment details again below.
          </p>
        </div>

        {isPaid && (
          <PaymentForm
            fee={fee}
            senderNumber={senderNumber}
            transactionId={transactionId}
            setSenderNumber={setSenderNumber}
            setTransactionId={setTransactionId}
            loading={loading}
            error={error}
            success={success}
            onSubmit={handlePaymentSubmission}
          />
        )}
      </div>
    );
  }

  if (registered && !isPaid) {
    return (
      <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-6">
        <h2 className="text-lg font-semibold text-emerald-900">
          You are registered
        </h2>

        <p className="mt-2 text-sm text-emerald-700">
          Your registration for this Olympiad is confirmed.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
              Registration
            </p>

            <h1 className="mt-1 text-2xl font-bold text-zinc-950">
              {olympiad.title}
            </h1>
          </div>

          <div className="shrink-0 rounded-full bg-zinc-100 px-3 py-1 text-xs font-semibold text-zinc-700">
            {isPaid ? "Paid" : "Free"}
          </div>
        </div>

        {olympiad.description && (
          <p className="mt-4 text-sm leading-6 text-zinc-600">
            {olympiad.description}
          </p>
        )}

        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          <InfoItem label="Questions" value={String(questionCount)} />

          <InfoItem
            label="Duration"
            value={`${olympiad.durationMinutes} minutes`}
          />

          <InfoItem
            label="Registration"
            value={isPaid ? `৳${fee.toFixed(2)}` : "Free"}
          />

          <InfoItem label="Phase" value={phase.replaceAll("_", " ")} />
        </div>
      </div>

      {isPaid ? (
        <PaymentForm
          fee={fee}
          senderNumber={senderNumber}
          transactionId={transactionId}
          setSenderNumber={setSenderNumber}
          setTransactionId={setTransactionId}
          loading={loading}
          error={error}
          success={success}
          onSubmit={handlePaymentSubmission}
        />
      ) : (
        <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-zinc-950">
            Confirm registration
          </h2>

          <p className="mt-2 text-sm leading-6 text-zinc-600">
            This Olympiad is free. Confirm your registration to reserve your
            place.
          </p>

          {error && (
            <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              {error}
            </div>
          )}

          {success && (
            <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">
              {success}
            </div>
          )}

          <button
            type="button"
            onClick={handleFreeRegistration}
            disabled={loading}
            className="mt-6 w-full rounded-xl bg-black px-5 py-3 text-sm font-semibold text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? "Registering..." : "Confirm Registration"}
          </button>
        </div>
      )}
    </div>
  );
}

function PaymentForm({
  fee,
  senderNumber,
  transactionId,
  setSenderNumber,
  setTransactionId,
  loading,
  error,
  success,
  onSubmit,
}: {
  fee: number;
  senderNumber: string;
  transactionId: string;
  setSenderNumber: (value: string) => void;
  setTransactionId: (value: string) => void;
  loading: boolean;
  error: string;
  success: string;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
}) {
  return (
    <form
      onSubmit={onSubmit}
      className="space-y-6 rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm"
    >
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
          Payment required
        </p>

        <h2 className="mt-1 text-xl font-bold text-zinc-950">
          Complete your registration
        </h2>

        <p className="mt-2 text-sm leading-6 text-zinc-600">
          Registration fee:{" "}
          <span className="font-semibold text-zinc-950">৳{fee.toFixed(2)}</span>
        </p>
      </div>

      <div className="rounded-2xl border border-pink-200 bg-pink-50 p-5">
        <p className="text-sm font-semibold text-pink-950">Pay using bKash</p>

        <p className="mt-3 text-sm leading-6 text-pink-900">
          Send <strong>৳{fee.toFixed(2)}</strong> to the following bKash number:
        </p>

        <div className="mt-3 rounded-xl border border-pink-200 bg-white px-4 py-3 text-center">
          <span className="text-lg font-bold tracking-wide text-zinc-950">
            {BKASH_NUMBER}
          </span>
        </div>

        <p className="mt-3 text-xs leading-5 text-pink-800">
          After completing the payment, enter the bKash number you paid from and
          the transaction ID below.
        </p>
      </div>

      <div className="space-y-4">
        <div>
          <label
            htmlFor="senderNumber"
            className="mb-2 block text-sm font-medium text-zinc-900"
          >
            bKash number used for payment
          </label>

          <input
            id="senderNumber"
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            value={senderNumber}
            onChange={(event) => setSenderNumber(event.target.value)}
            placeholder="01XXXXXXXXX"
            required
            disabled={loading}
            className="w-full rounded-xl border border-zinc-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-zinc-900 focus:ring-2 focus:ring-zinc-900/10 disabled:bg-zinc-100"
          />
        </div>

        <div>
          <label
            htmlFor="transactionId"
            className="mb-2 block text-sm font-medium text-zinc-900"
          >
            bKash transaction ID
          </label>

          <input
            id="transactionId"
            type="text"
            value={transactionId}
            onChange={(event) =>
              setTransactionId(event.target.value.toUpperCase())
            }
            placeholder="Enter transaction ID"
            required
            disabled={loading}
            className="w-full rounded-xl border border-zinc-300 bg-white px-4 py-3 text-sm uppercase outline-none transition focus:border-zinc-900 focus:ring-2 focus:ring-zinc-900/10 disabled:bg-zinc-100"
          />
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm leading-6 text-red-700">
          {error}
        </div>
      )}

      {success && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm leading-6 text-emerald-700">
          {success}
        </div>
      )}

      <button
        type="submit"
        disabled={
          loading ||
          senderNumber.trim().length < 8 ||
          transactionId.trim().length < 3
        }
        className="w-full rounded-xl bg-black px-5 py-3 text-sm font-semibold text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {loading ? "Submitting payment..." : "Confirm Purchase"}
      </button>

      <p className="text-center text-xs leading-5 text-zinc-500">
        Your registration will remain pending until an authorized admin verifies
        the payment.
      </p>
    </form>
  );
}

function InfoItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-zinc-50 p-4">
      <p className="text-xs font-medium text-zinc-500">{label}</p>

      <p className="mt-1 text-sm font-semibold capitalize text-zinc-900">
        {value}
      </p>
    </div>
  );
}
