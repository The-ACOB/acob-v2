"use client";

import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/Badge";
import { useToast } from "@/components/dashboard/Toast";
import { togglePopupAction } from "@/lib/popups/actions";

export type PopupRow = {
  id: string;
  content: string;
  active: boolean;
  priority: number;
  startAt: string | null;
  endAt: string | null;
};

export function PopupsList({ items }: { items: PopupRow[] }) {
  const router = useRouter();
  const { toast } = useToast();

  async function toggle(id: string, active: boolean) {
    const result = await togglePopupAction(id, active);
    if (!result.ok) return toast("error", "Could not update", result.error);
    toast("success", active ? "Activated" : "Deactivated");
    router.refresh();
  }

  if (items.length === 0) {
    return <p className="text-sm text-muted">No popups yet.</p>;
  }

  return (
    <div className="flex flex-col gap-3">
      {items.map((item) => (
        <div key={item.id} className="rounded-lg border border-border bg-elevated p-4">
          <div className="flex items-start justify-between gap-4">
            <p className="max-w-lg text-sm text-primary">{item.content}</p>
            <Badge tone={item.active ? "success" : "neutral"}>{item.active ? "Active" : "Inactive"}</Badge>
          </div>
          <div className="mt-3 flex items-center gap-4">
            <span className="font-mono text-[10px] uppercase tracking-[0.1em] text-muted">Priority {item.priority}</span>
            <button
              type="button"
              onClick={() => toggle(item.id, !item.active)}
              className="text-xs text-accent underline underline-offset-4"
            >
              {item.active ? "Deactivate" : "Activate"}
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
