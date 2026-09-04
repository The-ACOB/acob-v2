"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Pencil } from "lucide-react";
import { ContentForm } from "@/components/dashboard/ContentForm";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { useToast } from "@/components/dashboard/Toast";
import { createContentAction, updateContentAction, setContentStatusAction } from "@/lib/content/actions";
import type { CONTENT_KINDS } from "@/lib/content/validation";

export type ContentRow = {
  id: string;
  title: string;
  description: string | null;
  body: string | null;
  externalUrl: string | null;
  status: "draft" | "published" | "unpublished" | "archived";
  publishedAt: string | null;
};

const STATUS_TONE = { draft: "neutral", published: "success", unpublished: "warning", archived: "error" } as const;

export function ContentManager({
  kind,
  items,
  canManage,
}: {
  kind: (typeof CONTENT_KINDS)[number];
  items: ContentRow[];
  canManage: boolean;
}) {
  const [mode, setMode] = useState<"none" | "create" | string>("none");
  const router = useRouter();
  const { toast } = useToast();

  async function setStatus(id: string, status: "published" | "unpublished" | "archived") {
    const result = await setContentStatusAction(id, kind, status);
    if (!result.ok) return toast("error", "Could not update", result.error);
    toast("success", "Updated");
    router.refresh();
  }

  if (!canManage) {
    const visible = items.filter((i) => i.status === "published");
    if (visible.length === 0) {
      return <EmptyState title="Nothing published yet" description="Check back soon." />;
    }
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {visible.map((item) => (
          <div key={item.id} className="rounded-lg border border-border bg-elevated p-5">
            <p className="font-display text-lg text-primary">{item.title}</p>
            {item.description ? <p className="mt-2 text-sm text-secondary">{item.description}</p> : null}
            {item.externalUrl ? (
              <a href={item.externalUrl} target="_blank" rel="noopener noreferrer" className="mt-3 inline-block text-xs text-accent underline underline-offset-4">
                Open
              </a>
            ) : null}
          </div>
        ))}
      </div>
    );
  }

  if (mode === "create") {
    return (
      <ContentForm
        onSubmit={(values) => createContentAction(kind, values)}
        onDone={() => setMode("none")}
      />
    );
  }

  const editing = items.find((i) => i.id === mode);
  if (editing) {
    return (
      <ContentForm
        defaultValues={{
          title: editing.title,
          description: editing.description ?? "",
          body: editing.body ?? "",
          externalUrl: editing.externalUrl ?? "",
        }}
        onSubmit={(values) => updateContentAction(editing.id, kind, values)}
        onDone={() => setMode("none")}
      />
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {items.length === 0 ? (
        <p className="text-sm text-muted">Nothing here yet.</p>
      ) : (
        <div className="flex flex-col gap-3">
          {items.map((item) => (
            <div key={item.id} className="rounded-lg border border-border bg-elevated p-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm text-primary">{item.title}</p>
                  {item.description ? <p className="mt-1 text-xs text-secondary">{item.description}</p> : null}
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
                ) : (
                  <button type="button" onClick={() => setStatus(item.id, "unpublished")} className="text-xs text-secondary underline underline-offset-4">
                    Unpublish
                  </button>
                )}
                {item.status !== "archived" ? (
                  <button type="button" onClick={() => setStatus(item.id, "archived")} className="text-xs text-error underline underline-offset-4">
                    Archive
                  </button>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      )}

      <Button variant="secondary" className="w-fit text-xs" onClick={() => setMode("create")}>
        <Plus className="h-3.5 w-3.5" /> New
      </Button>
    </div>
  );
}
