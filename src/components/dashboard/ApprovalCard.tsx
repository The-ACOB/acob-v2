"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { ConfirmDialog } from "@/components/dashboard/ConfirmDialog";
import { useToast } from "@/components/dashboard/Toast";
import { approveRequestAction, rejectRequestAction } from "@/lib/approvals/actions";

export type ApprovalRow = {
  id: string;
  type: string;
  targetType: string;
  targetId: string;
  reason: string | null;
  createdAt: string;
  requester: { email: string; fullName: string | null };
  isSelf: boolean;
};

export function ApprovalCard({ request }: { request: ApprovalRow }) {
  const [dialog, setDialog] = useState<"approve" | "reject" | null>(null);
  const [pending, setPending] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  async function handleDecision(kind: "approve" | "reject") {
    setPending(true);
    const action = kind === "approve" ? approveRequestAction : rejectRequestAction;
    const result = await action(request.id);
    setPending(false);
    if (!result.ok) {
      toast("error", kind === "approve" ? "Could not approve" : "Could not reject", result.error);
      return;
    }
    toast("success", kind === "approve" ? "Request approved" : "Request rejected");
    router.refresh();
  }

  return (
    <div className="rounded-lg border border-border bg-elevated p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="font-display text-lg text-primary">{request.type.replace(/_/g, " ")}</p>
          <p className="mt-1 text-xs text-muted">
            Target: <span className="text-secondary">{request.targetType}</span> · {request.targetId}
          </p>
        </div>
        <Badge tone="warning">Pending</Badge>
      </div>

      <dl className="mt-4 grid grid-cols-1 gap-3 text-xs sm:grid-cols-2">
        <div>
          <dt className="text-muted">Requester</dt>
          <dd className="mt-0.5 text-secondary">{request.requester.fullName ?? request.requester.email}</dd>
        </div>
        <div>
          <dt className="text-muted">Requested</dt>
          <dd className="mt-0.5 text-secondary">{new Date(request.createdAt).toLocaleString()}</dd>
        </div>
        {request.reason ? (
          <div className="sm:col-span-2">
            <dt className="text-muted">Reason</dt>
            <dd className="mt-0.5 text-secondary">{request.reason}</dd>
          </div>
        ) : null}
      </dl>

      {request.isSelf ? (
        <p className="mt-4 text-xs text-muted">You submitted this request — it must be reviewed by someone else.</p>
      ) : (
        <div className="mt-5 flex gap-3">
          <Button
            variant="secondary"
            className="text-xs"
            disabled={pending}
            onClick={() => setDialog("approve")}
          >
            <Check className="h-3.5 w-3.5" /> Approve
          </Button>
          <Button
            variant="ghost"
            className="text-xs text-error hover:text-error"
            disabled={pending}
            onClick={() => setDialog("reject")}
          >
            <X className="h-3.5 w-3.5" /> Reject
          </Button>
        </div>
      )}

      <ConfirmDialog
        open={dialog === "approve"}
        onOpenChange={(o) => !o && setDialog(null)}
        title="Approve this request?"
        description="This will mark the request approved and record the decision in the audit log."
        confirmLabel="Approve"
        onConfirm={() => handleDecision("approve")}
      />
      <ConfirmDialog
        open={dialog === "reject"}
        onOpenChange={(o) => !o && setDialog(null)}
        title="Reject this request?"
        description="This will mark the request rejected and record the decision in the audit log."
        confirmLabel="Reject"
        tone="destructive"
        onConfirm={() => handleDecision("reject")}
      />
    </div>
  );
}
