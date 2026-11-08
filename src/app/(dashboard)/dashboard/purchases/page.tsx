import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentSession } from "@/lib/auth/session";
import { db } from "@/lib/db/client";

export const metadata = { title: "My Purchases" };
export default async function MyPurchasesPage() {
  const session = await getCurrentSession();
  if (!session) redirect("/login?returnTo=/dashboard/purchases");
  const purchases = await db.resourcePurchase.findMany({ where: { userId: session.id }, include: { content: true }, orderBy: { createdAt: "desc" } });
  const pending = purchases.filter(p => p.status === "pending");
  const reviewed = purchases.filter(p => p.status !== "pending");
  return <div className="mx-auto max-w-5xl space-y-8"><header><p className="field-kicker">Your account</p><h1 className="mt-2 font-display text-3xl text-primary">My purchases</h1><p className="mt-2 text-sm text-secondary">Track payment verification and access your approved resources.</p></header>
    <section><h2 className="mb-3 text-lg font-semibold text-primary">Awaiting approval <span className="ml-2 rounded-full bg-amber-500/10 px-2 py-1 text-xs text-amber-500">{pending.length}</span></h2>{pending.length ? <div className="space-y-3">{pending.map(p => <article key={p.id} className="rounded-xl border border-amber-500/30 bg-elevated p-5"><div className="flex flex-wrap justify-between gap-2"><h3 className="font-semibold text-primary">{p.content.title}</h3><span className="text-xs font-medium text-amber-500">Pending verification</span></div><p className="mt-2 text-xs text-secondary">{p.method.toUpperCase()} · Transaction {p.transactionId} · ৳{Number(p.amount).toLocaleString("en-BD")}</p><p className="mt-2 text-xs text-muted">Submitted {p.createdAt.toLocaleDateString("en-BD")}. Verification usually takes up to 24 hours.</p></article>)}</div> : <p className="rounded-xl border border-border p-5 text-sm text-muted">You have no purchases awaiting approval.</p>}</section>
    <section><h2 className="mb-3 text-lg font-semibold text-primary">Purchase history</h2>{reviewed.length ? <div className="divide-y divide-border rounded-xl border border-border">{reviewed.map(p => <div key={p.id} className="flex flex-wrap items-center justify-between gap-3 p-4"><div><p className="font-medium text-primary">{p.content.title}</p><p className="mt-1 text-xs text-muted">{p.createdAt.toLocaleDateString("en-BD")}</p>{p.status === "rejected" && p.rejectionReason ? <p className="mt-1 text-xs text-red-500">{p.rejectionReason}</p> : null}</div>{p.status === "approved" ? <Link href={`/resources/${p.content.slug}`} className="rounded-lg bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground">Open resource</Link> : <span className="text-xs text-red-500">Not approved</span>}</div>)}</div> : <p className="rounded-xl border border-border p-5 text-sm text-muted">Your approved and reviewed purchases will appear here.</p>}</section>
  </div>;
}
