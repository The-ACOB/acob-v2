import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { requireAuth } from "@/lib/authz/guards";
import { db } from "@/lib/db/client";
import { DashboardPageHeader } from "@/components/dashboard/PageHeader";
import { ParticipantProfileForm } from "@/components/dashboard/ParticipantProfileForm";

export const metadata: Metadata = { title: "My Profile" };

export default async function ProfilePage() {
  const session = await requireAuth();
  const [profile, participant] = await Promise.all([
    db.profile.findUnique({ where: { userId: session.id } }),
    db.participant.findUnique({ where: { userId: session.id } }),
  ]);

  if (!participant || !profile) redirect("/dashboard");

  return (
    <div>
      <DashboardPageHeader
        title="My profile"
        description="Keep your participant information up to date."
        breadcrumbs={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "My profile" },
        ]}
      />
      <ParticipantProfileForm
        userId={session.id}
        defaultValues={{
          fullName: profile.fullName,
          institution: participant.institution ?? "",
          gradeLevel: participant.gradeLevel ?? "",
        }}
      />
    </div>
  );
}
