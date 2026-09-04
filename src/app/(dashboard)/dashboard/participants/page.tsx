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
  roles: string[];
};

export default async function ParticipantsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  let actor;
  try {
    actor = await requirePermission("participant:view");
  } catch (err) {
    if (err instanceof AuthError) redirect("/dashboard");
    throw err;
  }

  const { q } = await searchParams;

  const query = q?.trim();
  const participants = await db.participant.findMany({
    where: query
      ? {
          user: {
            OR: [
              { email: { contains: query, mode: "insensitive" } },
              {
                profile: { fullName: { contains: query, mode: "insensitive" } },
              },
            ],
          },
        }
      : undefined,
    take: 100,
    include: { user: { include: { profile: true } } },
  });

  let rows: Row[] = participants.map((p) => ({
    id: p.id,
    userId: p.userId,
    institution: p.institution,
    gradeLevel: p.gradeLevel,
    email: p.user.email,
    fullName: p.user.profile?.fullName ?? null,
    roles: [],
  }));

  if (actor.roleKeys.includes("CEO")) {
    const users = await db.user.findMany({
      where: query
        ? {
            OR: [
              { email: { contains: query, mode: "insensitive" } },
              {
                profile: { fullName: { contains: query, mode: "insensitive" } },
              },
            ],
          }
        : undefined,
      take: 100,
      include: {
        profile: true,
        participant: true,
        userRoles: { include: { role: true } },
      },
      orderBy: { createdAt: "desc" },
    });
    rows = users.map((user) => ({
      id: user.participant?.id ?? user.id,
      userId: user.id,
      institution: user.participant?.institution ?? null,
      gradeLevel: user.participant?.gradeLevel ?? null,
      email: user.email,
      fullName: user.profile?.fullName ?? null,
      roles: user.userRoles.map((assignment) => assignment.role.key),
    }));
  }

  const columns: Column<Row>[] = [
    {
      header: "Name",
      cell: (r) => <span className="text-primary">{r.fullName ?? "—"}</span>,
    },
    { header: "Email", cell: (r) => r.email },
    { header: "Roles", cell: (r) => r.roles.join(", ") || "—" },
    { header: "Institution", cell: (r) => r.institution ?? "—" },
    {
      header: "Grade",
      cell: (r) =>
        r.gradeLevel ? <Badge tone="neutral">{r.gradeLevel}</Badge> : "—",
    },
    {
      header: "",
      hideLabel: true,
      cell: (r) => (
        <Link
          href={`/dashboard/participants/${r.userId}`}
          className="text-xs text-accent underline underline-offset-4"
        >
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
        breadcrumbs={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Participants" },
        ]}
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
        <button
          type="submit"
          className="rounded-md border border-border-strong px-4 py-2 text-xs text-primary transition-colors hover:border-accent"
        >
          Search
        </button>
      </form>

      <DataTable
        columns={columns}
        rows={rows}
        getRowId={(r) => r.id}
        emptyTitle="No participants found"
      />
    </div>
  );
}
