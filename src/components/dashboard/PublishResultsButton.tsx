"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/dashboard/ConfirmDialog";
import { useToast } from "@/components/dashboard/Toast";
import { publishResultsAction } from "@/lib/olympiads/actions";

export function PublishResultsButton({
  olympiadId,
  hasAttempts,
}: {
  olympiadId: string;
  hasAttempts: boolean;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);

  async function handleConfirm() {
    setPending(true);
    const result = await publishResultsAction(olympiadId);
    setPending(false);

    if (!result.ok) {
      toast("error", "Could not publish results", result.error);
      return;
    }

    toast(
      "success",
      "Results published",
      "Participants can now see their own result and recognition.",
    );
    setOpen(false);
    router.refresh();
  }

  if (!hasAttempts) return null;

  return (
    <>
      <Button
        variant="primary"
        className="text-xs"
        disabled={pending}
        onClick={() => setOpen(true)}
      >
        Publish results
      </Button>

      <ConfirmDialog
        open={open}
        onOpenChange={setOpen}
        title="Publish results to participants?"
        description="This will make each eligible participant's own score, position, and recognition visible in their dashboard. The full ranking table will remain staff-only."
        confirmLabel={pending ? "Publishing…" : "Publish results"}
        onConfirm={handleConfirm}
      />
    </>
  );
}
