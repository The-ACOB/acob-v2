import { redirect } from "next/navigation";
import { requireRole, AuthError } from "@/lib/authz/guards";
import { DashboardPageHeader } from "@/components/dashboard/PageHeader";

export default async function ReportsPage() {
  try {
    await requireRole("CEO");
  } catch (err) {
    if (err instanceof AuthError) redirect("/dashboard");
    throw err;
  }
  const reports = ["participants", "users", "olympiads", "summary"];
  return (
    <div>
      <DashboardPageHeader
        title="Reports & Export"
        description="Download organization-wide CSV reports."
        breadcrumbs={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Reports" },
        ]}
      />
      <div className="mt-8 flex flex-col gap-3">
        {reports.map((type) => (
          <a
            key={type}
            href={`/api/admin/reports?type=${type}`}
            className="w-fit text-sm text-accent underline underline-offset-4"
          >
            Download {type} CSV
          </a>
        ))}
      </div>
    </div>
  );
}
