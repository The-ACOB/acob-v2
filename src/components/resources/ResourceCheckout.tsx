"use client";
import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { submitResourcePurchaseAction } from "@/lib/payments/resource-actions";

export function ResourceCheckout({ contentId, qrUrl }: { contentId: string; qrUrl: string }) {
  const [method, setMethod] = useState<"bkash" | "nagad">("bkash");
  const [senderNumber, setSenderNumber] = useState("");
  const [transactionId, setTransactionId] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);
  const router = useRouter();
  async function submit(e: React.FormEvent) {
    e.preventDefault(); setBusy(true); setError("");
    try {
      const result = await submitResourcePurchaseAction({ contentId, method, senderNumber, transactionId });
      if (!result.ok) { setError(result.error); return; }
      setDone(true);
    } catch { setError("We could not submit your purchase. Please try again."); }
    finally { setBusy(false); }
  }
  if (done) return <div role="dialog" aria-modal="true" className="text-center py-8"><div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-500 text-2xl">✓</div><h2 className="mt-5 font-display text-2xl text-primary">Thank you for your purchase!</h2><p className="mx-auto mt-3 max-w-md text-sm leading-6 text-secondary">Your purchase has been enlisted and is awaiting approval. Our team will verify your payment, usually within 24 hours. You can track its status from your dashboard.</p><button onClick={() => router.push("/dashboard/purchases")} className="mt-7 rounded-lg bg-primary px-6 py-3 text-xs font-semibold uppercase tracking-wider text-primary-foreground">View purchase status</button></div>;
  return <form onSubmit={submit} className="space-y-6">
    <div className="rounded-xl border border-border bg-white p-4"><p className="mb-3 text-center text-xs font-semibold uppercase tracking-wider text-slate-700">Scan this QR to pay</p><div className="relative mx-auto aspect-square w-full max-w-[260px]"><Image src={qrUrl} alt="Payment QR code for this resource" fill className="object-contain" unoptimized /></div></div>
    <div><p className="mb-3 text-xs font-semibold uppercase tracking-wider text-secondary">Choose payment method</p><div className="grid grid-cols-2 gap-3"><button type="button" onClick={() => setMethod("bkash")} className={`rounded-xl border p-4 text-left transition ${method === "bkash" ? "border-pink-500 bg-pink-500/10 ring-1 ring-pink-500" : "border-border bg-background"}`}><span className="text-xl font-black italic text-[#e2136e]">bKash</span><span className="mt-1 block text-[10px] text-muted">Mobile financial service</span></button><button type="button" onClick={() => setMethod("nagad")} className={`rounded-xl border p-4 text-left transition ${method === "nagad" ? "border-orange-500 bg-orange-500/10 ring-1 ring-orange-500" : "border-border bg-background"}`}><span className="text-xl font-black italic text-[#f26a21]">Nagad</span><span className="mt-1 block text-[10px] text-muted">Mobile financial service</span></button></div></div>
    <div className="grid gap-4 sm:grid-cols-2"><label className="block text-xs font-medium text-secondary">Number you sent money from<input required value={senderNumber} onChange={e => setSenderNumber(e.target.value)} inputMode="tel" placeholder="01XXXXXXXXX" className="mt-2 w-full rounded-lg border border-border bg-background px-3 py-3 text-sm text-primary outline-none focus:border-accent" /></label><label className="block text-xs font-medium text-secondary">Transaction ID<input required value={transactionId} onChange={e => setTransactionId(e.target.value.toUpperCase())} placeholder="Enter transaction ID" className="mt-2 w-full rounded-lg border border-border bg-background px-3 py-3 text-sm uppercase text-primary outline-none focus:border-accent" /></label></div>
    {error ? <p role="alert" className="rounded-lg bg-red-500/10 p-3 text-xs text-red-500">{error}</p> : null}
    <button disabled={busy || senderNumber.trim().length < 8 || transactionId.trim().length < 3} className="w-full rounded-lg bg-primary px-5 py-4 text-xs font-semibold uppercase tracking-[.15em] text-primary-foreground transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50">{busy ? "Submitting…" : "Confirm purchase"}</button>
    <p className="text-center text-[11px] leading-5 text-muted">By confirming, you state that the payment details are accurate. Access is granted only after an administrator verifies the transaction.</p>
  </form>;
}
