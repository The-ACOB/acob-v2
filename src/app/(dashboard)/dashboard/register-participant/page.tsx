import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { requirePermission, AuthError } from "@/lib/authz/guards";
import { DashboardPageHeader } from "@/components/dashboard/PageHeader";
import { RegisterParticipantForm } from "@/components/dashboard/RegisterParticipantForm";
import { ambassadorRegisterParticipantAction } from "@/lib/participants/actions";

export const metadata: Metadata = { title: "Register Participant" };

export default async function RegisterParticipantPage() {
  try {
    await requirePermission("participant:create");
  } catch (err) {
    if (err instanceof AuthError) redirect("/dashboard");
    throw err;
  }

  return (
    <div>
      <DashboardPageHeader
        title="Register a Participant"
        description="They'll receive an email to set their own password. This registration is linked to you as their referring ambassador."
        breadcrumbs={[{ label: "Dashboard", href: "/dashboard" }, { label: "Register Participant" }]}
      />
      <div className="max-w-xl">
        <RegisterParticipantForm onSubmit={ambassadorRegisterParticipantAction} />
      </div>
    </div>
  );
}
