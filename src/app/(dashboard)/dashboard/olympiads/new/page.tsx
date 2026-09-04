import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { requirePermission, AuthError } from "@/lib/authz/guards";
import { DashboardPageHeader } from "@/components/dashboard/PageHeader";
import { OlympiadForm } from "@/components/dashboard/OlympiadForm";
import { createOlympiadAction } from "@/lib/olympiads/actions";

export const metadata: Metadata = { title: "New Olympiad" };

export default async function NewOlympiadPage() {
  try {
    await requirePermission("olympiad:create");
  } catch (err) {
    if (err instanceof AuthError) redirect("/dashboard/olympiads");
    throw err;
  }

  return (
    <div>
      <DashboardPageHeader
        title="New Olympiad"
        breadcrumbs={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Olympiads", href: "/dashboard/olympiads" },
          { label: "New" },
        ]}
      />
      <div className="max-w-2xl">
        <OlympiadForm onSubmit={createOlympiadAction} submitLabel="Create draft" redirectOnSuccess={(id) => `/dashboard/olympiads/${id}`} />
      </div>
    </div>
  );
}
