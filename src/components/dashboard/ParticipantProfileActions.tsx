"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/dashboard/ConfirmDialog";
import { useToast } from "@/components/dashboard/Toast";
import {
  requestAmbassadorPromotionAction,
  staffTriggerPasswordResetAction,
} from "@/lib/participants/actions";

export function ParticipantProfileActions({
  userId,
  alreadyAmbassador,
  isCeo,
}: {
  userId: string;
  alreadyAmbassador: boolean;
  isCeo: boolean;
}) {
  const [confirming, setConfirming] = useState<"promote" | "reset" | null>(
    null,
  );
  const router = useRouter();
  const { toast } = useToast();

  async function handlePromote() {
    const result = await requestAmbassadorPromotionAction(userId);
    if (!result.ok)
      return toast("error", "Could not submit request", result.error);
    toast("success", "Ambassador promotion applied");
    router.refresh();
  }

  async function handleReset() {
    const result = await staffTriggerPasswordResetAction(userId);
    if (!result.ok)
      return toast("error", "Could not send reset email", result.error);
    toast("success", "Password reset email sent");
  }

  return (
    <div className="flex flex-wrap gap-3">
      {!alreadyAmbassador ? (
        <Button
          variant="secondary"
          className="text-xs"
          onClick={() => setConfirming("promote")}
        >
          {isCeo ? "Promote to ambassador" : "Request ambassador promotion"}
        </Button>
      ) : null}
      <Button
        variant="ghost"
        className="text-xs"
        onClick={() => setConfirming("reset")}
      >
        Send password reset
      </Button>

      <ConfirmDialog
        open={confirming === "promote"}
        onOpenChange={(o) => !o && setConfirming(null)}
        title="Promote to ambassador?"
        description={
          isCeo
            ? "This direct CEO role change takes effect immediately and is recorded in the audit log."
            : "This creates an approval request for executive review before the role is granted."
        }
        confirmLabel={isCeo ? "Promote" : "Submit request"}
        onConfirm={handlePromote}
      />
      <ConfirmDialog
        open={confirming === "reset"}
        onOpenChange={(o) => !o && setConfirming(null)}
        title="Send a password reset email?"
        description="They'll receive a link to set a new password. Their current password stays unchanged until they use it."
        confirmLabel="Send email"
        onConfirm={handleReset}
      />
    </div>
  );
}
