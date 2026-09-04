import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { requireRole, AuthError } from "@/lib/authz/guards";
import { db } from "@/lib/db/client";
import { DashboardPageHeader } from "@/components/dashboard/PageHeader";
import { DataTable, type Column } from "@/components/dashboard/DataTable";
import { Pagination } from "@/components/dashboard/Pagination";
import { ROLE_DEFINITIONS } from "@/lib/authz/roles";

export const metadata: Metadata = { title: "Audit Log" };

const PAGE_SIZE = 25;

type AuditRow = {
  id: string;
  action: string;
  targetType: string | null;
  targetId: string | null;
  createdAt: Date;
  actor: { email: string; profile: { fullName: string } | null } | null;
};

function buildQuery(params: Record<string, string | undefined>) {
  const q = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v) q.set(k, v);
  }
  return q.toString();
}

export default async function AuditLogPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | undefined }>;
}) {
  try {
    await requireRole("CEO", "COO", "CTO");
  } catch (err) {
    if (err instanceof AuthError) redirect("/dashboard");
    throw err;
  }

  const params = await searchParams;
  const page = Math.max(1, Number(params.page ?? "1") || 1);
  const action = params.action || undefined;
  const targetType = params.target || undefined;
  const userQuery = params.user || undefined;
  const role = params.role || undefined;
  const from = params.from || undefined;
  const to = params.to || undefined;

  const where: Record<string, unknown> = {};
  if (action) where.action = action;
  if (targetType) where.targetType = targetType;
  if (from || to) {
    where.createdAt = {
      ...(from ? { gte: new Date(from) } : {}),
      ...(to ? { lte: new Date(`${to}T23:59:59`) } : {}),
    };
  }

  if (role) {
    const roleUsers: { userId: string }[] = await db.userRole.findMany({
      where: { role: { key: role } },
    });
    where.actorId = { in: roleUsers.map((r) => r.userId) };
  } else if (userQuery) {
    const users: { id: string }[] = await db.user.findMany({
      where: { email: { contains: userQuery } },
    });
    where.actorId = { in: users.map((u) => u.id) };
  }

  const [total, logs]: [number, AuditRow[]] = await Promise.all([
    db.auditLog.count({ where }),
    db.auditLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: PAGE_SIZE,
      skip: (page - 1) * PAGE_SIZE,
      include: { actor: { include: { profile: true } } },
    }),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const columns: Column<AuditRow>[] = [
    {
      header: "Action",
      cell: (r) => (
        <span className="font-mono text-xs text-primary">{r.action}</span>
      ),
    },
    {
      header: "Actor",
      cell: (r) =>
        r.actor ? (
          (r.actor.profile?.fullName ?? r.actor.email)
        ) : (
          <span className="text-muted">system</span>
        ),
    },
    {
      header: "Target",
      cell: (r) =>
        r.targetType
          ? `${r.targetType}${r.targetId ? ` · ${r.targetId.slice(0, 8)}` : ""}`
          : "—",
    },
    {
      header: "When",
      cell: (r) => (
        <span className="text-xs text-muted">
          {r.createdAt.toLocaleString()}
        </span>
      ),
    },
  ];

  const baseParams = {
    action,
    target: targetType,
    user: userQuery,
    role,
    from,
    to,
  };

  return (
    <div>
      <DashboardPageHeader
        title="Audit Log"
        description="Security-sensitive actions across the platform — logins, role changes, approvals, and more."
        breadcrumbs={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Audit Log" },
        ]}
      />

      <form
        method="get"
        className="mb-6 flex flex-wrap items-end gap-3 rounded-lg border border-border bg-elevated/40 p-4"
      >
        <label className="flex flex-col gap-1 text-xs">
          <span className="font-mono uppercase tracking-[0.1em] text-muted">
            User (email contains)
          </span>
          <input
            name="user"
            defaultValue={userQuery}
            placeholder="jane@theacob.com"
            className="rounded-md border border-border-strong bg-elevated px-2.5 py-1.5 text-secondary focus:border-accent focus:outline-none"
          />
        </label>
        <label className="flex flex-col gap-1 text-xs">
          <span className="font-mono uppercase tracking-[0.1em] text-muted">
            Action
          </span>
          <input
            name="action"
            defaultValue={action}
            placeholder="auth:login"
            className="rounded-md border border-border-strong bg-elevated px-2.5 py-1.5 text-secondary focus:border-accent focus:outline-none"
          />
        </label>
        <label className="flex flex-col gap-1 text-xs">
          <span className="font-mono uppercase tracking-[0.1em] text-muted">
            Target type
          </span>
          <input
            name="target"
            defaultValue={targetType}
            placeholder="user"
            className="rounded-md border border-border-strong bg-elevated px-2.5 py-1.5 text-secondary focus:border-accent focus:outline-none"
          />
        </label>
        <label className="flex flex-col gap-1 text-xs">
          <span className="font-mono uppercase tracking-[0.1em] text-muted">
            Role
          </span>
          <select
            name="role"
            defaultValue={role ?? ""}
            className="rounded-md border border-border-strong bg-elevated px-2.5 py-1.5 text-secondary focus:border-accent focus:outline-none"
          >
            <option value="">All</option>
            {ROLE_DEFINITIONS.map((r) => (
              <option key={r.key} value={r.key}>
                {r.key}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-xs">
          <span className="font-mono uppercase tracking-[0.1em] text-muted">
            From
          </span>
          <input
            type="date"
            name="from"
            defaultValue={from}
            className="rounded-md border border-border-strong bg-elevated px-2.5 py-1.5 text-secondary focus:border-accent focus:outline-none"
          />
        </label>
        <label className="flex flex-col gap-1 text-xs">
          <span className="font-mono uppercase tracking-[0.1em] text-muted">
            To
          </span>
          <input
            type="date"
            name="to"
            defaultValue={to}
            className="rounded-md border border-border-strong bg-elevated px-2.5 py-1.5 text-secondary focus:border-accent focus:outline-none"
          />
        </label>
        <button
          type="submit"
          className="rounded-md border border-border-strong px-4 py-1.5 text-xs text-primary transition-colors hover:border-accent"
        >
          Apply
        </button>
        {(action || targetType || userQuery || role || from || to) && (
          <a
            href="/dashboard/audit"
            className="text-xs text-muted underline underline-offset-4"
          >
            Clear
          </a>
        )}
      </form>

      <DataTable
        columns={columns}
        rows={logs}
        getRowId={(r) => r.id}
        emptyTitle="No matching audit events"
        emptyDescription="Try widening your filters."
      />

      <Pagination
        page={page}
        totalPages={totalPages}
        makeHref={(p) =>
          `/dashboard/audit?${buildQuery({ ...baseParams, page: String(p) })}`
        }
      />
    </div>
  );
}
