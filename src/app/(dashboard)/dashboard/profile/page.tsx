import type { Metadata } from "next";
import { requireAuth } from "@/lib/authz/guards";
import { db } from "@/lib/db/client";
import { DashboardPageHeader } from "@/components/dashboard/PageHeader";
import { ParticipantProfileForm } from "@/components/dashboard/ParticipantProfileForm";

export const metadata: Metadata = { title: "My Profile" };

export default async function ProfilePage() {
  const session = await requireAuth();
  let [profile, participant] = await Promise.all([
    db.profile.findUnique({ where: { userId: session.id } }),
    db.participant.findUnique({ where: { userId: session.id } }),
  ]);

  if (!profile) {
    profile = await db.profile.create({
      data: { userId: session.id, fullName: session.fullName ?? session.email },
    });
  }
  if (!participant && session.roleKeys.includes("PARTICIPANT")) {
    participant = await db.participant.create({ data: { userId: session.id } });
  }

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
      {participant ? (
        <ParticipantProfileForm
          userId={session.id}
          defaultValues={{
            fullName: profile.fullName,
            phone: profile.phone ?? "",
            gender: participant.gender ?? "",
            institution: participant.institution ?? "",
            gradeLevel: participant.gradeLevel ?? "",
            academicLevel: participant.academicLevel ?? "",
            district: participant.district ?? "",
            address: participant.address ?? "",
            city: participant.city ?? "",
          }}
        />
      ) : (
        <div className="mt-6 rounded-lg border border-border bg-elevated p-6 text-sm text-secondary">
          <p>Email: {session.email}</p>
          <p className="mt-2">Roles: {session.roleKeys.join(", ") || "None"}</p>
        </div>
      )}
    </div>
  );
}
