"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { useToast } from "@/components/dashboard/Toast";
import type { ActionResult } from "@/lib/auth/actions";

export function StatusToggle({
  status,
  onChange,
}: {
  status: "open" | "resolved";
  onChange: (next: "open" | "resolved") => Promise<ActionResult>;
}) {
  const [pending, setPending] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  async function toggle() {
    const next = status === "open" ? "resolved" : "open";
    setPending(true);
    const result = await onChange(next);
    setPending(false);
    if (!result.ok) {
      toast("error", "Could not update status", result.error);
      return;
    }
    router.refresh();
  }

  return (
    <div className="flex items-center gap-3">
      <Badge tone={status === "open" ? "warning" : "success"}>{status === "open" ? "Open" : "Resolved"}</Badge>
      <Button variant="ghost" className="text-xs" disabled={pending} onClick={toggle}>
        {status === "open" ? "Mark resolved" : "Reopen"}
      </Button>
    </div>
  );
}
