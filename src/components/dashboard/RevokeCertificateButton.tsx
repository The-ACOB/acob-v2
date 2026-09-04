"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ConfirmDialog } from "@/components/dashboard/ConfirmDialog";
import { useToast } from "@/components/dashboard/Toast";
import { revokeCertificateAction } from "@/lib/certificates/actions";

export function RevokeCertificateButton({ id }: { id: string }) {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  async function handleRevoke() {
    const result = await revokeCertificateAction(id);
    if (!result.ok) {
      toast("error", "Could not revoke", result.error);
      return;
    }
    toast("success", "Certificate revoked");
    router.refresh();
  }

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className="text-xs text-error underline underline-offset-4">
        Revoke
      </button>
      <ConfirmDialog
        open={open}
        onOpenChange={setOpen}
        title="Revoke this certificate?"
        description="It will immediately fail public verification. This is recorded in the audit log."
        confirmLabel="Revoke"
        tone="destructive"
        onConfirm={handleRevoke}
      />
    </>
  );
}
