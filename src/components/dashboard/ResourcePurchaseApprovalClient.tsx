"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { reviewResourcePurchaseAction } from "@/lib/payments/resource-actions";

type Purchase = { id: string; resourceTitle: string; participantEmail: string; amount: string; method: "bkash" | "nagad"; senderNumber: string; transactionId: string; createdAt: string };
export function ResourcePurchaseApprovalClient({ purchases }: { purchases: Purchase[] }) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string,string>>({});
  async function decide(id: string, decision: "approve" | "reject") {
    setBusy(id);
    const result = await reviewResourcePurchaseAction({ purchaseId: id, decision, rejectionReason: errors[id] });
    setBusy(null);
    if (!result.ok) { setErrors(prev => ({ ...prev, [id]: result.error })); return; }
    router.refresh();
  }
  return <section className="space-y-4"><div><p className="field-kicker">Digital resources</p><h2 className="mt-1 font-display text-2xl text-primary">Resource purchase requests</h2><p className="mt-1 text-sm text-secondary">Verify the sender number and transaction ID against the payment records before approving.</p></div>
    {purchases.length === 0 ? <p className="rounded-xl border border-border p-6 text-sm text-muted">No resource purchases are awaiting review.</p> : purchases.map(p => <article key={p.id} className="rounded-xl border border-border bg-elevated p-5"><div className="flex flex-wrap items-start justify-between gap-3"><div><h3 className="font-semibold text-primary">{p.resourceTitle}</h3><p className="mt-1 text-xs text-secondary">{p.participantEmail}</p></div><p className="font-semibold text-primary">৳{Number(p.amount).toLocaleString("en-BD", {minimumFractionDigits:2})}</p></div><div className="mt-4 grid gap-3 rounded-lg bg-background p-4 text-xs sm:grid-cols-3"><div><p className="text-muted">Method</p><p className="mt-1 font-semibold uppercase text-primary">{p.method}</p></div><div><p className="text-muted">Sender number</p><p className="mt-1 font-mono text-primary">{p.senderNumber}</p></div><div><p className="text-muted">Transaction ID</p><p className="mt-1 font-mono font-semibold text-primary">{p.transactionId}</p></div></div><p className="mt-3 text-[10px] text-muted">Submitted {new Date(p.createdAt).toLocaleString()}</p><input value={errors[p.id] ?? ""} onChange={e => setErrors(prev => ({...prev,[p.id]:e.target.value}))} placeholder="Rejection reason (optional)" className="mt-4 w-full rounded-lg border border-border bg-background px-3 py-2 text-xs text-primary" /><div className="mt-3 flex justify-end gap-2"><button disabled={busy===p.id} onClick={() => decide(p.id,"reject")} className="rounded-lg border border-red-500/40 px-4 py-2 text-xs text-red-500 disabled:opacity-50">Reject</button><button disabled={busy===p.id} onClick={() => decide(p.id,"approve")} className="rounded-lg bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground disabled:opacity-50">{busy===p.id ? "Saving…" : "Approve purchase"}</button></div></article>)}
  </section>;
}
