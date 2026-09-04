"use client";

import { useRef, useEffect } from "react";
import { Button } from "@/components/ui/Button";

export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = "Confirm",
  tone = "default",
  onConfirm,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  confirmLabel?: string;
  tone?: "default" | "destructive";
  onConfirm: () => void | Promise<void>;
}) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      onClose={() => onOpenChange(false)}
      onCancel={() => onOpenChange(false)}
      className="m-auto w-full max-w-sm rounded-lg border border-border-strong bg-elevated p-0 text-primary backdrop:bg-black/70 backdrop:backdrop-blur-sm"
    >
      <div className="p-6">
        <h2 className="font-display text-xl text-primary">{title}</h2>
        {description ? <p className="mt-2 text-sm leading-relaxed text-secondary">{description}</p> : null}
        <div className="mt-6 flex justify-end gap-3">
          <Button variant="ghost" onClick={() => onOpenChange(false)} type="button">
            Cancel
          </Button>
          <Button
            variant={tone === "destructive" ? "primary" : "primary"}
            type="button"
            className={tone === "destructive" ? "bg-error text-background hover:bg-error/90" : undefined}
            onClick={async () => {
              await onConfirm();
              onOpenChange(false);
            }}
          >
            {confirmLabel}
          </Button>
        </div>
      </div>
    </dialog>
  );
}
