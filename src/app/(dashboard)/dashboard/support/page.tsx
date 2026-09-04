import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { requirePermission, AuthError } from "@/lib/authz/guards";
import { db } from "@/lib/db/client";
import { DashboardPageHeader } from "@/components/dashboard/PageHeader";
import { DataTable, type Column } from "@/components/dashboard/DataTable";
import { Badge } from "@/components/ui/Badge";
import { FilterBar } from "@/components/dashboard/FilterBar";

export const metadata: Metadata = { title: "Support Conversations" };

type Row = {
  id: string;
  status: "open" | "resolved";
  updatedAt: Date;
  participant: {
    email: string;
    profile: { fullName: string } | null;
  } | null;
};

export default async function SupportConversationsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  try {
    await requirePermission("support:view");
  } catch (err) {
    if (err instanceof AuthError) redirect("/dashboard");
    throw err;
  }

  const { status } = await searchParams;
  const where = status ? { status: status as "open" | "resolved" } : {};

  const conversations: Row[] = await db.conversation.findMany({
    where,
    orderBy: { updatedAt: "desc" },
    take: 50,
    include: {
      participant: {
        include: {
          profile: true,
        },
      },
    },
  });

  const columns: Column<Row>[] = [
    {
      header: "Participant",
      cell: (r) => (
        <span className="text-primary">
          {r.participant?.profile?.fullName ??
            r.participant?.email ??
            "Unknown"}
        </span>
      ),
    },
    {
      header: "Status",
      cell: (r) => (
        <Badge tone={r.status === "open" ? "warning" : "success"}>
          {r.status}
        </Badge>
      ),
    },
    {
      header: "Last activity",
      cell: (r) => (
        <span className="text-xs text-muted">
          {r.updatedAt.toLocaleString()}
        </span>
      ),
    },
    {
      header: "",
      hideLabel: true,
      cell: (r) => (
        <Link
          href={`/dashboard/support/${r.id}`}
          className="text-xs text-accent underline underline-offset-4"
        >
          Open
        </Link>
      ),
    },
  ];

  return (
    <div>
      <DashboardPageHeader
        title="Support Conversations"
        description="Messages from registered participants and ambassadors."
        breadcrumbs={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Support Conversations" },
        ]}
      />

      <FilterBar>
        <Link
          href="/dashboard/support"
          className={`text-xs ${!status ? "text-primary" : "text-muted"}`}
        >
          All
        </Link>

        <Link
          href="/dashboard/support?status=open"
          className={`text-xs ${
            status === "open" ? "text-primary" : "text-muted"
          }`}
        >
          Open
        </Link>

        <Link
          href="/dashboard/support?status=resolved"
          className={`text-xs ${
            status === "resolved" ? "text-primary" : "text-muted"
          }`}
        >
          Resolved
        </Link>
      </FilterBar>

      <DataTable
        columns={columns}
        rows={conversations}
        getRowId={(r) => r.id}
        emptyTitle="No support conversations"
        emptyDescription="Messages from participants and ambassadors will appear here."
      />
    </div>
  );
}
