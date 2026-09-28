import { requireRole } from "@/lib/authz/guards";
import { EXECUTIVE_ROLES } from "@/lib/authz/roles";
import {
  PERMISSIONS,
  PERMISSION_DESCRIPTIONS,
} from "@/lib/authz/permissions";
import { getRoleControlsAction } from "@/lib/authz/role-actions";
import RoleControlsClient from "./RoleControlsClient";

const PERMISSION_GROUPS = [
  {
    label: "Users",
    permissions: [
      "user:view",
      "user:create",
      "user:update",
      "user:delete",
      "role:assign",
      "role:remove",
    ],
  },
  {
    label: "Participants",
    permissions: [
      "participant:create",
      "participant:view",
      "participant:update",
      "participant:delete",
      "participant:referrals:view",
    ],
  },
  {
    label: "Olympiads",
    permissions: [
      "olympiad:create",
      "olympiad:update",
      "olympiad:publish",
      "olympiad:schedule",
      "olympiad:results:view",
    ],
  },
  {
    label: "Questions",
    permissions: [
      "question:create",
      "question:update",
      "question:delete",
      "question:publish",
    ],
  },
  {
    label: "Certificates",
    permissions: [
      "certificate:view",
      "certificate:issue",
      "certificate:revoke",
      "certificate:verify",
    ],
  },
  {
    label: "Recommendation Letters",
    permissions: [
      "recommendation_letter:view",
      "recommendation_letter:create",
      "recommendation_letter:publish",
      "recommendation_letter:revoke",
    ],
  },
  {
    label: "Content",
    permissions: [
      "content:create",
      "content:update",
      "content:publish",
      "content:delete",
      "podcast:create",
      "podcast:update",
      "podcast:delete",
    ],
  },
  {
    label: "Announcements",
    permissions: ["popup:manage"],
  },
  {
    label: "Contact & Support",
    permissions: [
      "contact:view",
      "contact:reply",
      "support:view",
      "support:reply",
    ],
  },
  {
    label: "Approvals",
    permissions: [
      "approval:view",
      "approval:approve",
      "approval:reject",
    ],
  },
  {
    label: "Notifications",
    permissions: ["notifications:view", "notifications:manage"],
  },
  {
    label: "Careers",
    permissions: [
      "career:create",
      "career:update",
      "career:delete",
    ],
  },
];

export default async function RoleControlsPage() {
  await requireRole(...EXECUTIVE_ROLES);

  const data = await getRoleControlsAction();

  const permissionDescriptions: Record<string, string> = Object.fromEntries(
    Object.entries(PERMISSION_DESCRIPTIONS).map(([key, value]) => [
      key,
      String(value),
    ]),
  );

  const permissionGroups = PERMISSION_GROUPS.map((group) => ({
    ...group,
    permissions: group.permissions.filter((permission) =>
      (PERMISSIONS as readonly string[]).includes(permission),
    ),
  }));

  return (
    <div className="space-y-8">
      <div>
        <p className="text-sm font-medium text-primary">Administration</p>

        <h1 className="mt-1 text-3xl font-semibold tracking-tight">
          Role Controls
        </h1>

        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
          Configure the permissions available to each organisation role.
          Changes apply to users with that role and determine which dashboard
          capabilities are available to them.
        </p>
      </div>

      <RoleControlsClient
        roles={data.roles}
        permissions={PERMISSIONS as unknown as string[]}
        permissionDescriptions={permissionDescriptions}
        permissionGroups={permissionGroups}
      />
    </div>
  );
}
