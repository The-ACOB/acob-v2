"use server";

import { db } from "@/lib/db/client";
import { requireAuth, requirePermission } from "@/lib/authz/guards";
import { isEligibleForOlympiad } from "@/lib/exam/eligibility";
import { isRegistrationOpen } from "@/lib/olympiads/lifecycle";
import { z } from "zod";

const paymentSubmissionSchema = z.object({
  senderNumber: z
    .string()
    .trim()
    .min(8, "Enter the bKash number used for payment.")
    .max(30, "Enter a valid bKash number."),
  transactionId: z
    .string()
    .trim()
    .min(3, "Enter the bKash transaction ID.")
    .max(100, "Transaction ID is too long."),
});

const paymentReviewSchema = z.object({
  paymentId: z.string().uuid(),
  decision: z.enum(["approve", "reject"]),
  rejectionReason: z
    .string()
    .trim()
    .max(500, "Rejection reason is too long.")
    .optional(),
});

export async function submitOlympiadPaymentAction(
  olympiadId: string,
  input: {
    senderNumber: string;
    transactionId: string;
  },
) {
  const session = await requireAuth();

  const parsed = paymentSubmissionSchema.safeParse(input);

  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Invalid payment details.",
    };
  }

  const olympiad = await db.olympiad.findUnique({
    where: {
      id: olympiadId,
    },
  });

  if (!olympiad || olympiad.status !== "published") {
    return {
      ok: false,
      error: "Olympiad not found.",
    };
  }

  if (olympiad.registrationType !== "paid") {
    return {
      ok: false,
      error: "This Olympiad does not require payment.",
    };
  }

  if (olympiad.registrationFee === null || olympiad.registrationFee.lte(0)) {
    return {
      ok: false,
      error: "This Olympiad does not have a valid registration fee.",
    };
  }

  if (!isRegistrationOpen(olympiad)) {
    return {
      ok: false,
      error: "Registration for this Olympiad is closed.",
    };
  }

  const eligible = await isEligibleForOlympiad(olympiad, session.id);

  if (!eligible) {
    return {
      ok: false,
      error: "You are not eligible for this Olympiad.",
    };
  }

  const existing = await db.olympiadRegistration.findUnique({
    where: {
      olympiadId_userId: {
        olympiadId,
        userId: session.id,
      },
    },
    include: {
      payments: {
        where: {
          status: "pending",
        },
        orderBy: {
          createdAt: "desc",
        },
        take: 1,
      },
    },
  });

  if (existing?.status === "confirmed") {
    return {
      ok: false,
      error: "You are already registered for this Olympiad.",
    };
  }

  if (existing?.status === "pending_approval") {
    return {
      ok: false,
      error: "Your payment is already waiting for admin confirmation.",
    };
  }

  if (existing?.payments.length) {
    return {
      ok: false,
      error: "You already have a payment waiting for admin confirmation.",
    };
  }

  const registrationFee = olympiad.registrationFee;

  if (registrationFee === null || registrationFee.lte(0)) {
    return {
      ok: false,
      error: "This Olympiad does not have a valid registration fee.",
    };
  }

  const registration = existing
    ? await db.olympiadRegistration.update({
        where: {
          id: existing.id,
        },
        data: {
          status: "pending_approval",
          confirmedAt: null,
        },
      })
    : await db.olympiadRegistration.create({
        data: {
          olympiadId,
          userId: session.id,
          status: "pending_approval",
        },
      });

  const payment = await db.olympiadPayment.create({
    data: {
      olympiadId,
      registrationId: registration.id,
      userId: session.id,
      method: "bkash",
      amount: registrationFee,
      senderNumber: parsed.data.senderNumber,
      transactionId: parsed.data.transactionId,
      status: "pending",
    },
  });

  return {
    ok: true,
    paymentId: payment.id,
  };
}

export async function reviewOlympiadPaymentAction(input: {
  paymentId: string;
  decision: "approve" | "reject";
  rejectionReason?: string;
}) {
  const session = await requireAuth();

  await requirePermission("payment:approve");

  const parsed = paymentReviewSchema.safeParse(input);

  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Invalid review request.",
    };
  }

  const payment = await db.olympiadPayment.findUnique({
    where: {
      id: parsed.data.paymentId,
    },
    include: {
      registration: true,
      olympiad: true,
    },
  });

  if (!payment) {
    return {
      ok: false,
      error: "Payment not found.",
    };
  }

  if (payment.status !== "pending") {
    return {
      ok: false,
      error: "This payment has already been reviewed.",
    };
  }

  if (parsed.data.decision === "approve") {
    const existingApprovedPayment = await db.olympiadPayment.findFirst({
      where: {
        transactionId: payment.transactionId,
        status: "approved",
        id: {
          not: payment.id,
        },
      },
    });

    if (existingApprovedPayment) {
      return {
        ok: false,
        error:
          "This transaction ID has already been approved for another payment.",
      };
    }

    await db.$transaction([
      db.olympiadPayment.update({
        where: {
          id: payment.id,
        },
        data: {
          status: "approved",
          reviewedBy: session.id,
          reviewedAt: new Date(),
          rejectionReason: null,
        },
      }),

      db.olympiadRegistration.update({
        where: {
          id: payment.registrationId,
        },
        data: {
          status: "confirmed",
          confirmedAt: new Date(),
        },
      }),
    ]);

    return {
      ok: true,
      message: "Payment approved and registration confirmed.",
    };
  }

  await db.$transaction([
    db.olympiadPayment.update({
      where: {
        id: payment.id,
      },
      data: {
        status: "rejected",
        reviewedBy: session.id,
        reviewedAt: new Date(),
        rejectionReason:
          parsed.data.rejectionReason?.trim() ||
          "Payment could not be verified.",
      },
    }),

    db.olympiadRegistration.update({
      where: {
        id: payment.registrationId,
      },
      data: {
        status: "rejected",
        confirmedAt: null,
      },
    }),
  ]);

  return {
    ok: true,
    message: "Payment rejected.",
  };
}
