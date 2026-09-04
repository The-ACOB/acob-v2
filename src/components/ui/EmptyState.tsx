import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function EmptyState({
  title,
  description,
  action,
  className,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-start gap-3 rounded-lg border border-dashed border-border-strong bg-elevated/40 px-6 py-10 sm:px-10",
        className
      )}
    >
      <h3 className="font-display text-xl text-primary">{title}</h3>
      {description ? <p className="max-w-md text-sm text-secondary">{description}</p> : null}
      {action}
    </div>
  );
}
