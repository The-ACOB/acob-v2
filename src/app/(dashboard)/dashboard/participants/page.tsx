import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { requirePermission, AuthError } from "@/lib/authz/guards";
import { db } from "@/lib/db/client";
import { DashboardPageHeader } from "@/components/dashboard/PageHeader";
import { DataTable, type Column } from "@/components/dashboard/DataTable";
import { RegisterParticipantForm } from "@/components/dashboard/RegisterParticipantForm";
import { hrRegisterParticipantAction } from "@/lib/participants/actions";
import { Badge } from "@/components/ui/Badge";

export const metadata: Metadata = { title: "Participants" };

type Row = {
  id: string;
  userId: string;
  institution: string | null;
  gradeLevel: string | null;
  email: string;
  fullName: string | null;
};

export default async function ParticipantsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  try {
    await requirePermission("participant:view");
  } catch (err) {
    if (err instanceof AuthError) redirect("/dashboard");
    throw err;
  }

  const { q } = await searchParams;

  const rawParticipants: { id: string; userId: string; institution: string | null; gradeLevel: string | null }[] =
    await db.participant.findMany({ take: 100 });

  const rows: Row[] = [];
  for (const p of rawParticipants) {
    const user = await db.user.findUnique({ where: { id: p.userId } });
    if (!user) continue;
    const profile: { fullName: string } | null = await db.profile.findUnique({ where: { userId: p.userId } });
    const fullName = profile?.fullName ?? null;
    if (q && !user.email.toLowerCase().includes(q.toLowerCase()) && !(fullName ?? "").toLowerCase().includes(q.toLowerCase())) {
      continue;
    }
    rows.push({ id: p.id, userId: p.userId, institution: p.institution, gradeLevel: p.gradeLevel, email: user.email, fullName });
  }

  const columns: Column<Row>[] = [
    { header: "Name", cell: (r) => <span className="text-primary">{r.fullName ?? "—"}</span> },
    { header: "Email", cell: (r) => r.email },
    { header: "Institution", cell: (r) => r.institution ?? "—" },
    { header: "Grade", cell: (r) => (r.gradeLevel ? <Badge tone="neutral">{r.gradeLevel}</Badge> : "—") },
    {
      header: "",
        hideLabel: true,
      cell: (r) => (
        <Link href={`/dashboard/participants/${r.userId}`} className="text-xs text-accent underline underline-offset-4">
          View
        </Link>
      ),
    },
  ];

  return (
    <div>
      <DashboardPageHeader
        title="Participants"
        description="Search, register, and manage participant accounts."
        breadcrumbs={[{ label: "Dashboard", href: "/dashboard" }, { label: "Participants" }]}
      />

      <div className="mb-10 max-w-xl">
        <RegisterParticipantForm onSubmit={hrRegisterParticipantAction} />
      </div>

      <form method="get" className="mb-5 flex gap-3">
        <input
          name="q"
          defaultValue={q}
          placeholder="Search by name or email…"
          className="w-full max-w-sm rounded-md border border-border-strong bg-elevated px-3 py-2 text-sm text-primary placeholder:text-muted focus:border-accent focus:outline-none"
        />
        <button type="submit" className="rounded-md border border-border-strong px-4 py-2 text-xs text-primary transition-colors hover:border-accent">
          Search
        </button>
      </form>

      <DataTable columns={columns} rows={rows} getRowId={(r) => r.id} emptyTitle="No participants found" />
    </div>
  );
}
