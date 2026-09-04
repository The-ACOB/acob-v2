"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Pencil } from "lucide-react";
import { CareerForm } from "@/components/dashboard/CareerForm";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/dashboard/Toast";
import { createCareerAction, updateCareerAction, setCareerStatusAction } from "@/lib/careers/actions";

export type CareerRow = {
  id: string;
  title: string;
  department: string | null;
  description: string;
  requirements: string | null;
  status: "draft" | "published" | "closed";
  deadline: string | null;
};

const STATUS_TONE = { draft: "neutral", published: "success", closed: "error" } as const;

export function CareersManager({ items }: { items: CareerRow[] }) {
  const [mode, setMode] = useState<"none" | "create" | string>("none");
  const router = useRouter();
  const { toast } = useToast();

  async function setStatus(id: string, status: "published" | "closed" | "draft") {
    const result = await setCareerStatusAction(id, status);
    if (!result.ok) return toast("error", "Could not update", result.error);
    toast("success", "Updated");
    router.refresh();
  }

  if (mode === "create") {
    return <CareerForm onSubmit={createCareerAction} onDone={() => setMode("none")} />;
  }

  const editing = items.find((i) => i.id === mode);
  if (editing) {
    return (
      <CareerForm
        defaultValues={{
          title: editing.title,
          department: editing.department ?? "",
          description: editing.description,
          requirements: editing.requirements ?? "",
          deadline: editing.deadline ? editing.deadline.slice(0, 10) : "",
        }}
        onSubmit={(values) => updateCareerAction(editing.id, values)}
        onDone={() => setMode("none")}
      />
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {items.length === 0 ? (
        <p className="text-sm text-muted">No listings yet.</p>
      ) : (
        <div className="flex flex-col gap-3">
          {items.map((item) => (
            <div key={item.id} className="rounded-lg border border-border bg-elevated p-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm text-primary">{item.title}</p>
                  {item.department ? <p className="mt-1 text-xs text-muted">{item.department}</p> : null}
                </div>
                <div className="flex shrink-0 items-center gap-3">
                  <Badge tone={STATUS_TONE[item.status]}>{item.status}</Badge>
                  <button type="button" onClick={() => setMode(item.id)} aria-label="Edit" className="text-muted hover:text-primary">
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
              <div className="mt-3 flex gap-3">
                {item.status !== "published" ? (
                  <button type="button" onClick={() => setStatus(item.id, "published")} className="text-xs text-accent underline underline-offset-4">
                    Publish
                  </button>
                ) : null}
                {item.status !== "closed" ? (
                  <button type="button" onClick={() => setStatus(item.id, "closed")} className="text-xs text-error underline underline-offset-4">
                    Close
                  </button>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      )}

      <Button variant="secondary" className="w-fit text-xs" onClick={() => setMode("create")}>
        <Plus className="h-3.5 w-3.5" /> New listing
      </Button>
    </div>
  );
}
