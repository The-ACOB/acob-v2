import { notFound, redirect } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { getCurrentSession } from "@/lib/auth/session";
import { db } from "@/lib/db/client";
import { ResourceCheckout } from "@/components/resources/ResourceCheckout";

export default async function ResourcePurchasePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const resource = await db.content.findFirst({ where: { slug, kind: "resource", status: "published", isPaid: true } });
  if (!resource || !resource.price || !resource.paymentQrCodeUrl) notFound();
  const session = await getCurrentSession();
  if (!session) redirect(`/login?returnTo=${encodeURIComponent(`/resources/${slug}/purchase`)}`);
  const previous = await db.resourcePurchase.findFirst({ where: { contentId: resource.id, userId: session.id, status: { in: ["pending", "approved"] } } });
  if (previous?.status === "approved") redirect(`/resources/${slug}`);
  if (previous?.status === "pending") redirect("/dashboard/purchases");

  return <main className="min-h-screen bg-background px-5 py-12"><div className="mx-auto max-w-2xl">
    <Link href={`/resources/${slug}`} className="text-xs text-muted hover:text-primary">← Back to resource</Link>
    <div className="mt-6 overflow-hidden rounded-2xl border border-border bg-elevated shadow-xl">
      <div className="border-b border-border px-6 py-6 sm:px-8"><p className="text-[10px] font-mono uppercase tracking-[.2em] text-accent">Secure resource checkout</p><h1 className="mt-3 font-display text-3xl text-primary">Complete your purchase</h1><p className="mt-2 text-sm text-secondary">{resource.title}</p><p className="mt-4 text-3xl font-semibold text-primary">৳{Number(resource.price).toLocaleString("en-BD", { minimumFractionDigits: 2 })}</p></div>
      <div className="p-6 sm:p-8"><ResourceCheckout contentId={resource.id} qrUrl={resource.paymentQrCodeUrl} /></div>
    </div>
    <p className="mt-5 text-center text-xs text-muted">Your payment is manually verified by the ACOB team. Do not submit a transaction more than once.</p>
  </div></main>;
}
