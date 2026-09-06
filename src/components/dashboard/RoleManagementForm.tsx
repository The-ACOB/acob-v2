"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { setUserRoleAction } from "@/lib/authz/role-actions";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/dashboard/Toast";

const ROLE_LABELS: Record<string, string> = {
  CEO: "CEO",
  COO: "COO",
  CTO: "CTO",
  HR_PR: "HR & PR",
  ACADEMIC: "Academic Staff",
  CONTENT_MEDIA: "Content & Media",
  SUPPORT: "Support",
  AMBASSADOR: "Ambassador",
  PARTICIPANT: "Participant",
};

const EXECUTIVE_ROLES = ["CEO", "COO", "CTO"];

const ALL_MANAGEABLE_ROLES = [
  "COO",
  "CTO",
  "HR_PR",
  "ACADEMIC",
  "CONTENT_MEDIA",
  "SUPPORT",
  "AMBASSADOR",
  "PARTICIPANT",
];

const NON_EXECUTIVE_ROLES = [
  "HR_PR",
  "ACADEMIC",
  "CONTENT_MEDIA",
  "SUPPORT",
  "AMBASSADOR",
  "PARTICIPANT",
];

export function RoleManagementForm({
  userId,
  currentRole,
  isCeo = false,
}: {
  userId: string;
  currentRole: string;
  isCeo?: boolean;
}) {
  const [role, setRole] = useState(currentRole);
  const [saving, setSaving] = useState(false);

  const router = useRouter();
  const { toast } = useToast();

  const isTargetExecutive = EXECUTIVE_ROLES.includes(currentRole);

  /*
   * The CEO role itself cannot be removed or reassigned.
   * This is also enforced server-side in hierarchy.ts.
   */
  if (currentRole === "CEO") {
    return (
      <div className="mt-6 rounded-lg border border-border bg-elevated p-5">
        <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted">
          Executive role management
        </p>

        <p className="mt-2 text-sm text-secondary">
          The CEO role cannot be modified or removed.
        </p>
      </div>
    );
  }

  /*
   * COO and CTO are executive roles.
   * Only the CEO can modify them.
   */
  if (!isCeo && isTargetExecutive) {
    return (
      <div className="mt-6 rounded-lg border border-border bg-elevated p-5">
        <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted">
          Executive role management
        </p>

        <p className="mt-2 text-sm text-secondary">
          Only the CEO may modify executive roles (CEO, COO, CTO).
        </p>
      </div>
    );
  }

  /*
   * CEO can assign any role except CEO.
   *
   * COO and CTO have the same operational authority, but neither
   * can assign or modify executive roles.
   */
  const availableRoles = isCeo ? ALL_MANAGEABLE_ROLES : NON_EXECUTIVE_ROLES;

  async function save() {
    if (saving || role === currentRole) return;

    setSaving(true);

    try {
      const result = await setUserRoleAction(userId, role);

      if (!result.ok) {
        toast("error", "Role change failed", result.error);
        return;
      }

      toast("success", "Role updated successfully");
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  const isDemotingAmbassador =
    currentRole === "AMBASSADOR" && role === "PARTICIPANT";

  return (
    <div className="mt-6 rounded-lg border border-border bg-elevated p-5">
      <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted">
        {isCeo ? "CEO role management" : "Executive role management"}
      </p>

      <div className="mt-3 flex flex-wrap items-center gap-3">
        <select
          aria-label="User role"
          value={role}
          onChange={(event) => setRole(event.target.value)}
          className="rounded-md border border-border-strong bg-background px-3 py-2 text-sm text-primary"
          disabled={saving}
        >
          {availableRoles.map((key) => (
            <option key={key} value={key}>
              {ROLE_LABELS[key] ?? key}
            </option>
          ))}
        </select>

        <Button
          type="button"
          variant="secondary"
          disabled={saving || role === currentRole}
          onClick={save}
        >
          {saving
            ? "Saving..."
            : isDemotingAmbassador
              ? "Demote to Participant"
              : "Save role"}
        </Button>
      </div>

      <p className="mt-3 text-xs text-muted">
        {isCeo
          ? "Only the CEO can assign or modify executive roles. Demoting an Ambassador deactivates access without deleting referral history."
          : "You can manage lower-level roles, but only the CEO can assign, demote, or remove executive roles."}
      </p>
    </div>
  );
}
