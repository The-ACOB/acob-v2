"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db/client";
import { requireAuth, requirePermission } from "@/lib/authz/guards";
import { notify } from "@/lib/notifications";
import { sendEmail } from "@/lib/email";

const submissionSchema = z.object({
  contentId: z.string().uuid(),
  method: z.enum(["bkash", "nagad"]),
  senderNumber: z.string().trim().min(8).max(30),
  transactionId: z.string().trim().min(3).max(100),
});

export async function submitResourcePurchaseAction(input: unknown) {
  const session = await requireAuth();
  const parsed = submissionSchema.safeParse(input);
  if (!parsed.success) return { ok: false as const, error: parsed.error.issues[0]?.message ?? "Invalid payment details." };

  const resource = await db.content.findFirst({ where: { id: parsed.data.contentId, kind: "resource", status: "published", isPaid: true } });
  if (!resource || !resource.price || !resource.paymentQrCodeUrl) return { ok: false as const, error: "This paid resource is not available for purchase right now." };

  const existing = await db.resourcePurchase.findFirst({ where: { contentId: resource.id, userId: session.id, status: { in: ["pending", "approved"] } } });
  if (existing?.status === "approved") return { ok: false as const, error: "You already own this resource." };
  if (existing?.status === "pending") return { ok: false as const, error: "Your purchase is already awaiting approval." };

  const [duplicateResourcePayment, duplicateOlympiadPayment] = await Promise.all([
    db.resourcePurchase.findFirst({ where: { transactionId: parsed.data.transactionId } }),
    db.olympiadPayment.findFirst({ where: { transactionId: parsed.data.transactionId, status: { in: ["pending", "approved"] } } }),
  ]);
  if (duplicateResourcePayment || duplicateOlympiadPayment) return { ok: false as const, error: "This transaction ID has already been submitted." };

  const purchase = await db.resourcePurchase.create({ data: {
    contentId: resource.id, userId: session.id, amount: resource.price,
    method: parsed.data.method, senderNumber: parsed.data.senderNumber,
    transactionId: parsed.data.transactionId, status: "pending",
  } });
  revalidatePath("/dashboard/purchases");
  return { ok: true as const, purchaseId: purchase.id };
}

export async function reviewResourcePurchaseAction(input: { purchaseId: string; decision: "approve" | "reject"; rejectionReason?: string }) {
  const session = await requireAuth();
  await requirePermission("payment:approve");
  const parsed = z.object({ purchaseId: z.string().uuid(), decision: z.enum(["approve", "reject"]), rejectionReason: z.string().max(500).optional() }).safeParse(input);
  if (!parsed.success) return { ok: false as const, error: "Invalid review request." };
  const purchase = await db.resourcePurchase.findUnique({ where: { id: parsed.data.purchaseId }, include: { content: true, payer: true } });
  if (!purchase) return { ok: false as const, error: "Purchase not found." };
  if (purchase.status !== "pending") return { ok: false as const, error: "This purchase has already been reviewed." };
  if (parsed.data.decision === "approve") {
    const [duplicateResourcePayment, duplicateOlympiadPayment] = await Promise.all([
      db.resourcePurchase.findFirst({ where: { transactionId: purchase.transactionId, status: "approved", id: { not: purchase.id } } }),
      db.olympiadPayment.findFirst({ where: { transactionId: purchase.transactionId, status: "approved" } }),
    ]);
    if (duplicateResourcePayment || duplicateOlympiadPayment) return { ok: false as const, error: "This transaction ID has already been approved for another payment." };
  }
  const approved = parsed.data.decision === "approve";
  await db.resourcePurchase.update({ where: { id: purchase.id }, data: {
    status: approved ? "approved" : "rejected", reviewedBy: session.id, reviewedAt: new Date(),
    rejectionReason: approved ? null : (parsed.data.rejectionReason?.trim() || "Payment could not be verified."),
  } });
  await notify({
    userId: purchase.userId, type: "approval:completed",
    title: approved ? "Your resource purchase is verified" : "Your resource purchase needs attention",
    body: approved ? `Your purchase of “${purchase.content.title}” has been verified. The resource is now available in your account.` : `Your purchase of “${purchase.content.title}” was not approved. ${parsed.data.rejectionReason?.trim() || "Please contact support if you believe this is a mistake."}`,
    metadata: { resourcePurchaseId: purchase.id, contentId: purchase.contentId },
    email: false,
  });
  const safeTitle = purchase.content.title.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c] ?? c));
  await sendEmail({
    to: purchase.payer.email,
    subject: approved ? "Your ACOB resource purchase has been verified" : "Update on your ACOB resource purchase",
    html: `<div style="font-family:Arial,sans-serif;max-width:560px;margin:auto;color:#202124"><p style="font-size:12px;letter-spacing:2px;color:#777">APPLIED COGNITIO OLYMPIAD BANGLADESH</p><h2>${approved ? "Purchase verified" : "Purchase not approved"}</h2><p>Your purchase of <strong>${safeTitle}</strong> has been ${approved ? "verified" : "reviewed and not approved"}.</p>${approved ? `<p>Your resource is now available in your dashboard.</p>` : `<p>${(parsed.data.rejectionReason || "Please contact support if you believe this is a mistake.").replace(/[&<>"']/g, "")}</p>`}<p style="margin-top:28px;color:#777;font-size:12px">ACOB Support Team</p></div>`,
  });
  revalidatePath("/dashboard/payment-approvals");
  revalidatePath("/dashboard/purchases");
  revalidatePath(`/resources/${purchase.content.slug}`);
  return { ok: true as const };
}
