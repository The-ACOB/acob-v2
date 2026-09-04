"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/dashboard/ConfirmDialog";
import { useToast } from "@/components/dashboard/Toast";
import { publishOlympiadAction, unpublishOlympiadAction, publishResultsAction } from "@/lib/olympiads/actions";

export function OlympiadPublishControls({
  olympiadId,
  status,
  resultsPublished,
  hasAttempts,
}: {
  olympiadId: string;
  status: "draft" | "published" | "unpublished";
  resultsPublished: boolean;
  hasAttempts: boolean;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [confirming, setConfirming] = useState<"publish" | "unpublish" | "results" | null>(null);
  const [pending, setPending] = useState(false);

  async function handlePublish() {
    setPending(true);
    const result = await publishOlympiadAction(olympiadId);
    setPending(false);
    if (!result.ok) return toast("error", "Could not publish", result.error);
    toast("success", "Olympiad published");
    router.refresh();
  }

  async function handleUnpublish() {
    setPending(true);
    const result = await unpublishOlympiadAction(olympiadId);
    setPending(false);
    if (!result.ok) return toast("error", "Could not unpublish", result.error);
    toast("success", "Olympiad unpublished");
    router.refresh();
  }

  async function handlePublishResults() {
    setPending(true);
    const result = await publishResultsAction(olympiadId);
    setPending(false);
    if (!result.ok) return toast("error", "Could not publish results", result.error);
    toast("success", "Results published");
    router.refresh();
  }

  return (
    <div className="flex flex-wrap gap-3">
      {status !== "published" ? (
        <Button variant="primary" className="text-xs" disabled={pending} onClick={() => setConfirming("publish")}>
          Publish
        </Button>
      ) : (
        <Button variant="secondary" className="text-xs" disabled={pending} onClick={() => setConfirming("unpublish")}>
          Unpublish
        </Button>
      )}

      {hasAttempts && !resultsPublished ? (
        <Button variant="secondary" className="text-xs" disabled={pending} onClick={() => setConfirming("results")}>
          Publish results
        </Button>
      ) : null}

      <ConfirmDialog
        open={confirming === "publish"}
        onOpenChange={(o) => !o && setConfirming(null)}
        title="Publish this Olympiad?"
        description="It will become visible and open to participants immediately."
        confirmLabel="Publish"
        onConfirm={handlePublish}
      />
      <ConfirmDialog
        open={confirming === "unpublish"}
        onOpenChange={(o) => !o && setConfirming(null)}
        title="Unpublish this Olympiad?"
        description="Participants will no longer be able to start new attempts. In-progress attempts are unaffected."
        confirmLabel="Unpublish"
        tone="destructive"
        onConfirm={handleUnpublish}
      />
      <ConfirmDialog
        open={confirming === "results"}
        onOpenChange={(o) => !o && setConfirming(null)}
        title="Publish results to participants?"
        description="Ranks will be computed and every participant's score will be locked and made visible on their dashboard."
        confirmLabel="Publish results"
        onConfirm={handlePublishResults}
      />
    </div>
  );
}
