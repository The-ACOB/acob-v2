import type { Metadata } from "next";
import { getCurrentSession } from "@/lib/auth/session";
import { hasPermission } from "@/lib/authz/guards";
import { db } from "@/lib/db/client";
import { DashboardPageHeader } from "@/components/dashboard/PageHeader";
import { ContentManager, type ContentRow } from "@/components/dashboard/ContentManager";

export const metadata: Metadata = { title: "Resources" };

export default async function ResourcesAdminPage() {
  const session = await getCurrentSession();
  if (!session) return null;

  const canManage = await hasPermission("content:create");

  const raw: {
    id: string; title: string; description: string | null; body: string | null;
    externalUrl: string | null; status: "draft" | "published" | "unpublished" | "archived";
    publishedAt: Date | null;
  }[] = await db.content.findMany({ where: { kind: "resource" }, orderBy: { createdAt: "desc" } });

  const items: ContentRow[] = raw.map((r) => ({
    id: r.id, title: r.title, description: r.description, body: r.body,
    externalUrl: r.externalUrl, status: r.status,
    publishedAt: r.publishedAt ? r.publishedAt.toISOString() : null,
  }));

  return (
    <div>
      <DashboardPageHeader title="Resources" breadcrumbs={[{ label: "Dashboard", href: "/dashboard" }, { label: "Resources" }]} />
      <ContentManager kind="resource" items={items} canManage={canManage} />
    </div>
  );
}
