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
        description="Set the participant's password here, optionally email the credentials, and create the account immediately."
        breadcrumbs={[{ label: "Dashboard", href: "/dashboard" }, { label: "Register Participant" }]}
      />
      <div className="max-w-xl">
        <RegisterParticipantForm onSubmit={ambassadorRegisterParticipantAction} />
      </div>
    </div>
  );
}
