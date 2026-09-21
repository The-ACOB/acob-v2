"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Pencil, ImageIcon } from "lucide-react";
import Image from "next/image";
import { ContentForm } from "@/components/dashboard/ContentForm";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { useToast } from "@/components/dashboard/Toast";
import {
  createContentAction,
  updateContentAction,
  setContentStatusAction,
} from "@/lib/content/actions";
import type { CONTENT_KINDS } from "@/lib/content/validation";

export type ContentRow = {
  id: string;
  title: string;
  description: string | null;
  body: string | null;
  externalUrl: string | null;
  thumbnailUrl?: string | null;
  status: "draft" | "published" | "unpublished" | "archived";
  publishedAt: string | null;
};

const STATUS_TONE = {
  draft: "neutral",
  published: "success",
  unpublished: "warning",
  archived: "error",
} as const;

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
  const isPodcast = kind === "podcast";

  async function setStatus(
    id: string,
    status: "published" | "unpublished" | "archived",
  ) {
    const result = await setContentStatusAction(id, kind, status);
    if (!result.ok) return toast("error", "Could not update", result.error);
    toast("success", "Updated");
    router.refresh();
  }

  if (!canManage) {
    const visible = items.filter((i) => i.status === "published");
    if (visible.length === 0) {
      return (
        <EmptyState
          title="Nothing published yet"
          description="Check back soon."
        />
      );
    }
    return (
      <div
        className={`grid grid-cols-1 gap-4 ${isPodcast ? "max-w-5xl" : "sm:grid-cols-2"}`}
      >
        {visible.map((item) => (
          <div
            key={item.id}
            className={`rounded-xl border border-border bg-elevated p-5 flex ${
              isPodcast ? "flex-col sm:flex-row gap-5 items-center" : "flex-col"
            }`}
          >
            {isPodcast && (
              <div className="relative aspect-video w-full sm:w-48 flex-shrink-0 overflow-hidden rounded-lg bg-black/40 border border-border">
                {item.thumbnailUrl ? (
                  <Image
                    src={item.thumbnailUrl}
                    alt={item.title}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-muted">
                    <ImageIcon className="h-6 w-6" />
                  </div>
                )}
              </div>
            )}
            <div className="flex-1">
              <p className="font-display text-lg text-primary">{item.title}</p>
              {item.description ? (
                <p className="mt-2 text-sm text-secondary line-clamp-2">
                  {item.description}
                </p>
              ) : null}
              {item.externalUrl ? (
                <a
                  href={item.externalUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-3 inline-block text-xs text-accent underline underline-offset-4"
                >
                  Open Episode
                </a>
              ) : null}
            </div>
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
    <div className="flex flex-col gap-4 max-w-5xl">
      <div className="flex justify-end">
        <Button variant="primary" onClick={() => setMode("create")}>
          <Plus className="mr-2 h-4 w-4" /> Add New
        </Button>
      </div>

      {items.length === 0 ? (
        <p className="text-sm text-muted">Nothing here yet.</p>
      ) : (
        <div className="flex flex-col gap-3">
          {items.map((item) => (
            <div
              key={item.id}
              className="rounded-xl border border-border bg-elevated p-5 transition-all hover:border-white/20"
            >
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-5">
                {/* Left side: Thumbnail + Content details */}
                <div className="flex flex-col sm:flex-row items-start gap-4 w-full">
                  {isPodcast && (
                    <div className="relative aspect-video w-full sm:w-44 flex-shrink-0 overflow-hidden rounded-lg bg-black/40 border border-border shadow-inner">
                      {item.thumbnailUrl ? (
                        <Image
                          src={item.thumbnailUrl}
                          alt={item.title}
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-muted">
                          <ImageIcon className="h-5 w-5" />
                        </div>
                      )}
                    </div>
                  )}

                  <div className="space-y-1.5 flex-1">
                    <p className="text-base font-semibold text-primary line-clamp-1">
                      {item.title}
                    </p>
                    {item.description ? (
                      <p className="line-clamp-2 text-xs text-secondary leading-relaxed">
                        {item.description}
                      </p>
                    ) : null}

                    {/* Inline Quick Action Links */}
                    <div className="flex items-center gap-3 pt-2">
                      {item.status !== "published" ? (
                        <button
                          type="button"
                          onClick={() => setStatus(item.id, "published")}
                          className="text-xs text-accent hover:underline underline-offset-4 font-medium"
                        >
                          Publish
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setStatus(item.id, "unpublished")}
                          className="text-xs text-secondary hover:underline underline-offset-4 font-medium"
                        >
                          Unpublish
                        </button>
                      )}
                      {item.status !== "archived" ? (
                        <button
                          type="button"
                          onClick={() => setStatus(item.id, "archived")}
                          className="text-xs text-error hover:underline underline-offset-4 font-medium"
                        >
                          Archive
                        </button>
                      ) : null}
                    </div>
                  </div>
                </div>

                {/* Right side: Status badge and Edit button */}
                <div className="flex shrink-0 items-center gap-4 self-end md:self-center border-t md:border-t-0 pt-3 md:pt-0 border-border w-full md:w-auto justify-between md:justify-end">
                  <Badge tone={STATUS_TONE[item.status]}>{item.status}</Badge>
                  <button
                    type="button"
                    onClick={() => setMode(item.id)}
                    aria-label="Edit"
                    className="flex items-center gap-1.5 text-xs text-muted hover:text-primary transition-colors px-2.5 py-1.5 rounded-md bg-white/5 border border-border"
                  >
                    <Pencil className="h-3.5 w-3.5" /> Edit
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
