import type { Metadata } from "next";
import { redirect, notFound } from "next/navigation";
import { requirePermission, AuthError } from "@/lib/authz/guards";
import { db } from "@/lib/db/client";
import { DashboardPageHeader } from "@/components/dashboard/PageHeader";
import { OlympiadForm } from "@/components/dashboard/OlympiadForm";
import { updateOlympiadAction } from "@/lib/olympiads/actions";

export const metadata: Metadata = { title: "Edit Olympiad" };

export default async function EditOlympiadPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  try {
    await requirePermission("olympiad:update");
  } catch (err) {
    if (err instanceof AuthError) redirect("/dashboard/olympiads");
    throw err;
  }

  const { id } = await params;
  const olympiad = await db.olympiad.findUnique({ where: { id } });
  if (!olympiad) notFound();

  async function submit(values: Parameters<typeof updateOlympiadAction>[1]) {
    "use server";
    return updateOlympiadAction(id, values);
  }

  return (
    <div>
      <DashboardPageHeader
        title="Edit settings"
        breadcrumbs={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Olympiads", href: "/dashboard/olympiads" },
          { label: olympiad.title, href: `/dashboard/olympiads/${id}` },
          { label: "Edit" },
        ]}
      />
      <div className="max-w-2xl">
        {olympiad.status === "published" ? (
          <p className="mb-6 text-sm text-warning">
            Unpublish this Olympiad from its detail page before editing
            settings.
          </p>
        ) : null}
        <OlympiadForm
          defaultValues={{
            title: olympiad.title,
            description: olympiad.description ?? "",
            subject: olympiad.subject ?? "",
            durationMinutes: olympiad.durationMinutes,
            startAt: olympiad.startAt,
            endAt: olympiad.endAt,
            negativeMarkingEnabled: olympiad.negativeMarkingEnabled,
            negativeMarkingValue: olympiad.negativeMarkingValue,
            eligibilityMode: olympiad.eligibilityMode as "open" | "criteria",
            eligibilityGradeLevel: olympiad.eligibilityGradeLevel ?? "",
            eligibilityInstitution: olympiad.eligibilityInstitution ?? "",
            eligibilityAcademicLevel: olympiad.eligibilityAcademicLevel ?? "",
          }}
          onSubmit={submit}
          submitLabel="Save changes"
          redirectPath={`/dashboard/olympiads/${id}`}
        />
      </div>
    </div>
  );
}
