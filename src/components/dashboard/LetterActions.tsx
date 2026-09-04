"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ConfirmDialog } from "@/components/dashboard/ConfirmDialog";
import { useToast } from "@/components/dashboard/Toast";
import { publishLetterAction, revokeLetterAction } from "@/lib/letters/actions";

export function LetterActions({ id, status }: { id: string; status: "draft" | "published" | "revoked" }) {
  const [confirming, setConfirming] = useState<"publish" | "revoke" | null>(null);
  const router = useRouter();
  const { toast } = useToast();

  async function handlePublish() {
    const result = await publishLetterAction(id);
    if (!result.ok) return toast("error", "Could not publish", result.error);
    toast("success", "Letter published");
    router.refresh();
  }

  async function handleRevoke() {
    const result = await revokeLetterAction(id);
    if (!result.ok) return toast("error", "Could not revoke", result.error);
    toast("success", "Letter revoked");
    router.refresh();
  }

  return (
    <div className="flex gap-3">
      {status === "draft" ? (
        <button type="button" onClick={() => setConfirming("publish")} className="text-xs text-accent underline underline-offset-4">
          Publish
        </button>
      ) : null}
      {status !== "revoked" ? (
        <button type="button" onClick={() => setConfirming("revoke")} className="text-xs text-error underline underline-offset-4">
          Revoke
        </button>
      ) : null}

      <ConfirmDialog
        open={confirming === "publish"}
        onOpenChange={(o) => !o && setConfirming(null)}
        title="Publish this letter?"
        description="The recipient will be notified and able to view/download it."
        confirmLabel="Publish"
        onConfirm={handlePublish}
      />
      <ConfirmDialog
        open={confirming === "revoke"}
        onOpenChange={(o) => !o && setConfirming(null)}
        title="Revoke this letter?"
        description="It will no longer be visible to the recipient. This is recorded in the audit log."
        confirmLabel="Revoke"
        tone="destructive"
        onConfirm={handleRevoke}
      />
    </div>
  );
}
