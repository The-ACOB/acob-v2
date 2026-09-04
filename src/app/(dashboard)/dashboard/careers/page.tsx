import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { requirePermission, AuthError } from "@/lib/authz/guards";
import { db } from "@/lib/db/client";
import { DashboardPageHeader } from "@/components/dashboard/PageHeader";
import { CareersManager, type CareerRow } from "@/components/dashboard/CareersManager";

export const metadata: Metadata = { title: "Careers" };

export default async function CareersAdminPage() {
  try {
    await requirePermission("career:create");
  } catch (err) {
    if (err instanceof AuthError) redirect("/dashboard");
    throw err;
  }

  const raw: {
    id: string; title: string; department: string | null; description: string;
    requirements: string | null; status: "draft" | "published" | "closed"; deadline: Date | null;
  }[] = await db.careerListing.findMany({ orderBy: { createdAt: "desc" } });

  const items: CareerRow[] = raw.map((r) => ({
    id: r.id, title: r.title, department: r.department, description: r.description,
    requirements: r.requirements, status: r.status,
    deadline: r.deadline ? r.deadline.toISOString() : null,
  }));

  return (
    <div>
      <DashboardPageHeader title="Careers" breadcrumbs={[{ label: "Dashboard", href: "/dashboard" }, { label: "Careers" }]} />
      <CareersManager items={items} />
    </div>
  );
}
