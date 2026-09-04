"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { setUserRoleAction } from "@/lib/authz/role-actions";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/dashboard/Toast";

export function RoleManagementForm({
  userId,
  currentRole,
}: {
  userId: string;
  currentRole: string;
}) {
  const [role, setRole] = useState(currentRole);
  const [saving, setSaving] = useState(false);
  const router = useRouter();
  const { toast } = useToast();
  async function save() {
    setSaving(true);
    const result = await setUserRoleAction(userId, role);
    setSaving(false);
    if (!result.ok) return toast("error", "Role change failed", result.error);
    toast("success", "Role changed directly by CEO");
    router.refresh();
  }
  return (
    <div className="mt-6 rounded-lg border border-border bg-elevated p-5">
      <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted">
        CEO role management
      </p>
      <div className="mt-3 flex flex-wrap items-center gap-3">
        <select
          aria-label="User role"
          value={role}
          onChange={(event) => setRole(event.target.value)}
          className="rounded-md border border-border-strong bg-background px-3 py-2 text-sm text-primary"
        >
          <option value="CEO">CEO</option>
          <option value="COO">COO</option>
          <option value="HR_PR">HR_PR</option>
          <option value="CTO">CTO</option>
          <option value="ACADEMIC">ACADEMIC</option>
          <option value="CONTENT_MEDIA">CONTENT_MEDIA</option>
          <option value="SUPPORT">SUPPORT</option>
          <option value="AMBASSADOR">AMBASSADOR</option>
          <option value="PARTICIPANT">PARTICIPANT</option>
        </select>
        <Button
          type="button"
          variant="secondary"
          disabled={saving || role === currentRole}
          onClick={save}
        >
          {saving
            ? "Saving..."
            : role === "PARTICIPANT" && currentRole === "AMBASSADOR"
              ? "Demote to Participant"
              : "Save role"}
        </Button>
      </div>
      <p className="mt-3 text-xs text-muted">
        Direct CEO action. Demoting an Ambassador deactivates access without
        deleting referral history.
      </p>
    </div>
  );
}
