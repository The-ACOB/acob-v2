import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { requirePermission, AuthError } from "@/lib/authz/guards";
import { db } from "@/lib/db/client";
import { DashboardPageHeader } from "@/components/dashboard/PageHeader";
import { DataTable, type Column } from "@/components/dashboard/DataTable";
import { Badge } from "@/components/ui/Badge";
import { FilterBar } from "@/components/dashboard/FilterBar";

export const metadata: Metadata = { title: "Contact Inbox" };

type Row = {
  id: string;
  name: string;
  email: string;
  subject: string;
  category: string;
  status: "open" | "resolved";
  createdAt: Date;
  _replyCount?: number;
};

export default async function ContactInboxPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  try {
    await requirePermission("contact:view");
  } catch (err) {
    if (err instanceof AuthError) redirect("/dashboard");
    throw err;
  }

  const { status } = await searchParams;
  const where = status ? { status: status as "open" | "resolved" } : {};

  const submissions: Row[] = await db.contactSubmission.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  const columns: Column<Row>[] = [
    { header: "From", cell: (r) => <span className="text-primary">{r.name}</span> },
    { header: "Subject", cell: (r) => r.subject },
    { header: "Category", cell: (r) => <span className="font-mono text-xs uppercase text-muted">{r.category}</span> },
    { header: "Status", cell: (r) => <Badge tone={r.status === "open" ? "warning" : "success"}>{r.status}</Badge> },
    { header: "Received", cell: (r) => <span className="text-xs text-muted">{r.createdAt.toLocaleString()}</span> },
    {
      header: "",
        hideLabel: true,
      cell: (r) => (
        <Link href={`/dashboard/contact/${r.id}`} className="text-xs text-accent underline underline-offset-4">
          Open
        </Link>
      ),
    },
  ];

  return (
    <div>
      <DashboardPageHeader
        title="Contact Inbox"
        description="Messages submitted through the public contact form."
        breadcrumbs={[{ label: "Dashboard", href: "/dashboard" }, { label: "Contact Inbox" }]}
      />

      <FilterBar>
        <Link href="/dashboard/contact" className={`text-xs ${!status ? "text-primary" : "text-muted"}`}>
          All
        </Link>
        <Link href="/dashboard/contact?status=open" className={`text-xs ${status === "open" ? "text-primary" : "text-muted"}`}>
          Open
        </Link>
        <Link href="/dashboard/contact?status=resolved" className={`text-xs ${status === "resolved" ? "text-primary" : "text-muted"}`}>
          Resolved
        </Link>
      </FilterBar>

      <DataTable
        columns={columns}
        rows={submissions}
        getRowId={(r) => r.id}
        emptyTitle="No contact messages"
        emptyDescription="Submissions from the public contact form will appear here."
      />
    </div>
  );
}
