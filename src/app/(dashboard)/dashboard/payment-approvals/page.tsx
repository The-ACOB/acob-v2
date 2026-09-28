import { requirePermission } from "@/lib/authz/guards";
import { db } from "@/lib/db/client";
import { PaymentApprovalClient } from "./PaymentApprovalClient";

export default async function PaymentApprovalsPage() {
  await requirePermission("payment:view");

  const payments = await db.olympiadPayment.findMany({
    where: {
      status: "pending",
    },
    include: {
      olympiad: true,
      payer: true,
      registration: true,
    },
    orderBy: {
      createdAt: "asc",
    },
  });

  const transactionIds = [
    ...new Set(payments.map((payment) => payment.transactionId)),
  ];

  const duplicateGroups =
    transactionIds.length > 0
      ? await db.olympiadPayment.groupBy({
          by: ["transactionId"],
          where: {
            transactionId: {
              in: transactionIds,
            },
          },
          _count: {
            _all: true,
          },
        })
      : [];

  const duplicateCounts = new Map(
    duplicateGroups.map((group) => [group.transactionId, group._count._all]),
  );

  const serializedPayments = payments.map((payment) => ({
    id: payment.id,
    olympiadId: payment.olympiadId,
    olympiadTitle: payment.olympiad.title,
    participantId: payment.userId,
    participantEmail: payment.payer.email,
    amount: payment.amount.toString(),
    senderNumber: payment.senderNumber,
    transactionId: payment.transactionId,

    // This query only retrieves pending payments.
    status: "pending" as const,

    createdAt: payment.createdAt.toISOString(),

    duplicateCount: duplicateCounts.get(payment.transactionId) ?? 1,
  }));

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
          Finance
        </p>

        <h1 className="mt-1 text-3xl font-bold tracking-tight text-zinc-950">
          Payment Approvals
        </h1>

        <p className="mt-2 text-sm text-zinc-600">
          Review bKash payments submitted for paid Olympiads.
        </p>
      </div>

      <PaymentApprovalClient payments={serializedPayments} />
    </div>
  );
}
