"use client";

import { useState, useTransition } from "react";
import { reviewOlympiadPaymentAction } from "@/lib/payments/actions";

type Payment = {
  id: string;
  olympiadId: string;
  olympiadTitle: string;
  participantId: string;
  participantEmail: string | null;
  amount: string;
  senderNumber: string;
  transactionId: string;
  status: "pending";
  createdAt: string;
  duplicateCount: number;
};

export function PaymentApprovalClient({ payments }: { payments: Payment[] }) {
  const [items, setItems] = useState(payments);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState("");

  async function review(
    paymentId: string,
    decision: "approve" | "reject",
    rejectionReason?: string,
  ) {
    setError("");

    startTransition(async () => {
      const result = await reviewOlympiadPaymentAction({
        paymentId,
        decision,
        rejectionReason,
      });

      if (!result.ok) {
        setError(result.error ?? "Unable to review this payment.");
        return;
      }

      setItems((current) =>
        current.filter((payment) => payment.id !== paymentId),
      );
    });
  }

  function handleApprove(payment: Payment) {
    if (payment.duplicateCount > 1) {
      const confirmed = window.confirm(
        `This transaction ID appears ${payment.duplicateCount} times in the payment records.\n\nOnly approve this payment if you have verified that this specific transaction is legitimate and has not already been used.`,
      );

      if (!confirmed) {
        return;
      }
    }

    void review(payment.id, "approve");
  }

  function handleReject(payment: Payment) {
    const reason = window.prompt(
      "Enter a reason for rejecting this payment:",
      "Payment could not be verified.",
    );

    if (reason === null) {
      return;
    }

    void review(
      payment.id,
      "reject",
      reason.trim() || "Payment could not be verified.",
    );
  }

  return (
    <div className="space-y-5">
      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {items.length === 0 ? (
        <div className="rounded-2xl border border-zinc-200 bg-white p-10 text-center shadow-sm">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-xl text-emerald-700">
            ✓
          </div>

          <h2 className="mt-4 text-lg font-semibold text-zinc-950">
            No pending payments
          </h2>

          <p className="mt-1 text-sm text-zinc-500">
            All submitted payments have been reviewed.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {items.map((payment) => (
            <PaymentCard
              key={payment.id}
              payment={payment}
              disabled={isPending}
              onApprove={handleApprove}
              onReject={handleReject}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function PaymentCard({
  payment,
  disabled,
  onApprove,
  onReject,
}: {
  payment: Payment;
  disabled: boolean;
  onApprove: (payment: Payment) => void;
  onReject: (payment: Payment) => void;
}) {
  const submittedAt = new Date(payment.createdAt);
  const isDuplicate = payment.duplicateCount > 1;

  return (
    <div
      className={`rounded-2xl border bg-white p-6 shadow-sm ${
        isDuplicate ? "border-red-300" : "border-zinc-200"
      }`}
    >
      {isDuplicate && (
        <div className="mb-5 rounded-xl border border-red-200 bg-red-50 p-4">
          <div className="flex items-start gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-red-600 text-sm font-bold text-white">
              !
            </div>

            <div>
              <p className="text-sm font-semibold text-red-900">
                Duplicate transaction ID detected
              </p>

              <p className="mt-1 text-sm leading-5 text-red-700">
                This transaction ID appears{" "}
                <strong>{payment.duplicateCount}</strong> times in the payment
                records. Verify the transaction carefully before approving it.
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0 flex-1">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
              Olympiad
            </p>

            <h2 className="mt-1 text-lg font-semibold text-zinc-950">
              {payment.olympiadTitle}
            </h2>
          </div>

          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <Detail label="Participant ID" value={payment.participantId} />

            <Detail
              label="Email"
              value={payment.participantEmail ?? "No email"}
            />

            <Detail
              label="Amount"
              value={`৳${Number(payment.amount).toFixed(2)}`}
            />

            <Detail label="bKash sender" value={payment.senderNumber} />

            <Detail label="Transaction ID" value={payment.transactionId} mono />

            <Detail label="Submitted" value={submittedAt.toLocaleString()} />
          </div>
        </div>

        <div className="flex shrink-0 flex-col gap-2 sm:flex-row lg:flex-col">
          <button
            type="button"
            disabled={disabled}
            onClick={() => onApprove(payment)}
            className="rounded-xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Approve Payment
          </button>

          <button
            type="button"
            disabled={disabled}
            onClick={() => onReject(payment)}
            className="rounded-xl border border-red-200 bg-white px-5 py-3 text-sm font-semibold text-red-700 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Reject Payment
          </button>
        </div>
      </div>
    </div>
  );
}

function Detail({
  label,
  value,
  mono = false,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div>
      <p className="text-xs font-medium text-zinc-500">{label}</p>

      <p
        className={`mt-1 break-all text-sm font-medium text-zinc-900 ${
          mono ? "font-mono tracking-wide" : ""
        }`}
      >
        {value}
      </p>
    </div>
  );
}
