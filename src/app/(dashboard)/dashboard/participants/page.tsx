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
import { ParticipantExportToolbar } from "@/components/dashboard/ParticipantExportToolbar";

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
  searchParams: Promise<{
    q?: string;
    institution?: string;
    grade?: string;
    role?: string;
  }>;
}) {
  let actor;
  try {
    actor = await requirePermission("participant:view");
  } catch (err) {
    if (err instanceof AuthError) redirect("/dashboard");
    throw err;
  }

  const { q, institution, grade, role } = await searchParams;

  const query = q?.trim();
  const selectedInstitution = institution?.trim();
  const selectedGrade = grade?.trim();
  const selectedRole = role?.trim();

  // Base where clauses for global user search
  const userWhereClause = {
    AND: [
      query
        ? {
            OR: [
              { email: { contains: query, mode: "insensitive" } },
              {
                profile: { fullName: { contains: query, mode: "insensitive" } },
              },
            ],
          }
        : {},
      selectedInstitution && selectedInstitution !== "ALL"
        ? {
            participant: {
              institution: { equals: selectedInstitution, mode: "insensitive" },
            },
          }
        : {},
      selectedGrade && selectedGrade !== "ALL"
        ? {
            participant: {
              gradeLevel: { equals: selectedGrade, mode: "insensitive" },
            },
          }
        : {},
      selectedRole && selectedRole !== "ALL"
        ? {
            userRoles: {
              some: {
                role: { key: { equals: selectedRole, mode: "insensitive" } },
              },
            },
          }
        : {},
    ],
  };

  const users = await db.user.findMany({
    where: userWhereClause,
    take: 200,
    include: {
      profile: true,
      participant: true,
      userRoles: { include: { role: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  const rows: Row[] = users.map((user) => ({
    id: user.participant?.id ?? user.id,
    userId: user.id,
    institution: user.participant?.institution ?? null,
    gradeLevel: user.participant?.gradeLevel ?? null,
    email: user.email,
    fullName: user.profile?.fullName ?? null,
    roles: user.userRoles.map((assignment) => assignment.role.key),
  }));

  // Fetch unique institutions from Participants
  const participantInstitutions = await db.participant.findMany({
    select: { institution: true },
    distinct: ["institution"],
    where: { institution: { not: null } },
  });
  const uniqueInstitutions = participantInstitutions
    .map((i) => i.institution)
    .filter(Boolean) as string[];

  // Fetch unique grades from Participants
  const participantGrades = await db.participant.findMany({
    select: { gradeLevel: true },
    distinct: ["gradeLevel"],
    where: { gradeLevel: { not: null } },
  });
  const uniqueGrades = participantGrades
    .map((g) => g.gradeLevel)
    .filter(Boolean) as string[];

  // Fetch all dynamic roles from the database
  const dbRoles = await db.role.findMany({
    select: { key: true },
    orderBy: { key: "asc" },
  });
  const uniqueRoles = dbRoles.map((r) => r.key);

  const columns: Column<Row>[] = [
    {
      header: "Name",
      cell: (r) => (
        <span className="font-medium text-primary">{r.fullName ?? "—"}</span>
      ),
    },
    {
      header: "Email",
      cell: (r) => <span className="text-muted">{r.email}</span>,
    },
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
          className="text-xs font-medium text-accent hover:underline underline-offset-4"
        >
          View
        </Link>
      ),
    },
  ];

  return (
    <div className="space-y-8 pb-12">
      <DashboardPageHeader
        title="Participants"
        description="Search, register, filter, and export participant accounts."
        breadcrumbs={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Participants" },
        ]}
      />

      {/* Register Form Section */}
      <div className="rounded-xl border border-border bg-elevated/30 p-6 shadow-sm">
        <h3 className="text-sm font-semibold text-primary mb-4">
          Register New Participant
        </h3>
        <div className="max-w-2xl">
          <RegisterParticipantForm onSubmit={hrRegisterParticipantAction} />
        </div>
      </div>

      {/* Advanced Filtering & Export Toolbar */}
      <form
        method="get"
        className="rounded-xl border border-border bg-elevated/40 p-4 shadow-sm space-y-4"
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <input
            name="q"
            defaultValue={q}
            placeholder="Search name or email…"
            className="w-full rounded-md border border-border-strong bg-elevated px-3 py-2 text-sm text-primary placeholder:text-muted focus:border-accent focus:outline-none"
          />

          <select
            name="institution"
            defaultValue={selectedInstitution || "ALL"}
            className="w-full rounded-md border border-border-strong bg-elevated px-3 py-2 text-sm text-primary focus:border-accent focus:outline-none"
          >
            <option value="ALL">All Institutions</option>
            {uniqueInstitutions.map((inst) => (
              <option key={inst} value={inst}>
                {inst}
              </option>
            ))}
          </select>

          <select
            name="grade"
            defaultValue={selectedGrade || "ALL"}
            className="w-full rounded-md border border-border-strong bg-elevated px-3 py-2 text-sm text-primary focus:border-accent focus:outline-none"
          >
            <option value="ALL">All Grades / Classes</option>
            {uniqueGrades.map((grade) => (
              <option key={grade} value={grade}>
                Grade {grade}
              </option>
            ))}
          </select>

          <select
            name="role"
            defaultValue={selectedRole || "ALL"}
            className="w-full rounded-md border border-border-strong bg-elevated px-3 py-2 text-sm text-primary focus:border-accent focus:outline-none"
          >
            <option value="ALL">All Roles</option>
            {uniqueRoles.map((roleKey) => (
              <option key={roleKey} value={roleKey}>
                {roleKey}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-border/60">
          <div className="flex items-center gap-2">
            <button
              type="submit"
              className="rounded-md border border-border-strong bg-accent/10 px-4 py-2 text-xs font-medium text-accent transition-colors hover:bg-accent/20"
            >
              Apply Filters
            </button>
            {(query ||
              (selectedInstitution && selectedInstitution !== "ALL") ||
              (selectedGrade && selectedGrade !== "ALL") ||
              (selectedRole && selectedRole !== "ALL")) && (
              <Link
                href="/dashboard/participants"
                className="text-xs text-muted hover:text-primary transition-colors"
              >
                Reset
              </Link>
            )}
          </div>

          <ParticipantExportToolbar rows={rows} />
        </div>
      </form>

      {/* Data Table */}
      <div className="rounded-xl border border-border bg-elevated/20 overflow-hidden shadow-sm">
        <DataTable
          columns={columns}
          rows={rows}
          getRowId={(r) => r.id}
          emptyTitle="No participants found matching criteria"
        />
      </div>
    </div>
  );
}
