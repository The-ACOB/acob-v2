import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

export function Pagination({
  page,
  totalPages,
  makeHref,
}: {
  page: number;
  totalPages: number;
  makeHref: (page: number) => string;
}) {
  if (totalPages <= 1) return null;

  const prevDisabled = page <= 1;
  const nextDisabled = page >= totalPages;

  return (
    <div className="mt-6 flex items-center justify-between">
      <p className="font-mono text-xs text-muted">
        Page {page} of {totalPages}
      </p>
      <div className="flex items-center gap-2">
        <Link
          href={prevDisabled ? "#" : makeHref(page - 1)}
          aria-disabled={prevDisabled}
          className={cn(
            "flex h-8 w-8 items-center justify-center rounded-md border border-border-strong transition-colors",
            prevDisabled ? "pointer-events-none opacity-30" : "text-secondary hover:text-primary"
          )}
        >
          <ChevronLeft className="h-4 w-4" />
        </Link>
        <Link
          href={nextDisabled ? "#" : makeHref(page + 1)}
          aria-disabled={nextDisabled}
          className={cn(
            "flex h-8 w-8 items-center justify-center rounded-md border border-border-strong transition-colors",
            nextDisabled ? "pointer-events-none opacity-30" : "text-secondary hover:text-primary"
          )}
        >
          <ChevronRight className="h-4 w-4" />
        </Link>
      </div>
    </div>
  );
}
