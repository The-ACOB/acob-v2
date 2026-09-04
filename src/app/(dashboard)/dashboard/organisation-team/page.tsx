import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { DashboardPageHeader } from "@/components/dashboard/PageHeader";
import { OrganisationTeamManager } from "@/components/dashboard/OrganisationTeamManager";
import { requireRole, AuthError } from "@/lib/authz/guards";
import { db } from "@/lib/db/client";
import {
  createOrganisationTeamMemberAction,
  updateOrganisationTeamMemberAction,
} from "@/lib/organisation-team/actions";

export const metadata: Metadata = { title: "Organisation Team" };

export default async function OrganisationTeamPage() {
  try {
    await requireRole("CEO");
  } catch (err) {
    if (err instanceof AuthError) redirect("/dashboard");
    throw err;
  }

  const members = await db.organisationTeamMember.findMany({
    orderBy: [{ displayOrder: "asc" }, { createdAt: "asc" }],
  });
  return (
    <div>
      <DashboardPageHeader
        title="Organisation Team"
        description="Manage the people explicitly represented as the public ACOB organisation team."
        breadcrumbs={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "People" },
          { label: "Organisation Team" },
        ]}
      />
      <OrganisationTeamManager
        members={members.map((member) => ({
          id: member.id,
          name: member.name,
          title: member.title,
          bio: member.bio ?? "",
          imageUrl: member.imageUrl ?? "",
          displayOrder: member.displayOrder,
          active: member.active,
          linkedinUrl: member.linkedinUrl ?? "",
          websiteUrl: member.websiteUrl ?? "",
        }))}
        create={createOrganisationTeamMemberAction}
        update={updateOrganisationTeamMemberAction}
      />
    </div>
  );
}
