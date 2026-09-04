import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { requirePermission, AuthError } from "@/lib/authz/guards";
import { db } from "@/lib/db/client";
import { DashboardPageHeader } from "@/components/dashboard/PageHeader";
import { PopupForm } from "@/components/dashboard/PopupForm";
import { PopupsList, type PopupRow } from "@/components/dashboard/PopupsList";

export const metadata: Metadata = { title: "Popup Management" };

export default async function PopupsAdminPage() {
  try {
    await requirePermission("popup:manage");
  } catch (err) {
    if (err instanceof AuthError) redirect("/dashboard");
    throw err;
  }

  const raw: {
    id: string; content: string; active: boolean; priority: number;
    startAt: Date | null; endAt: Date | null;
  }[] = await db.popup.findMany({ orderBy: { priority: "desc" } });

  const items: PopupRow[] = raw.map((r) => ({
    id: r.id, content: r.content, active: r.active, priority: r.priority,
    startAt: r.startAt ? r.startAt.toISOString() : null,
    endAt: r.endAt ? r.endAt.toISOString() : null,
  }));

  return (
    <div>
      <DashboardPageHeader
        title="Popup Management"
        description="A single highest-priority active popup shows as a dismissible banner on the public site."
        breadcrumbs={[{ label: "Dashboard", href: "/dashboard" }, { label: "Popup Management" }]}
      />
      <div className="mb-10 max-w-xl">
        <PopupForm />
      </div>
      <PopupsList items={items} />
    </div>
  );
}
