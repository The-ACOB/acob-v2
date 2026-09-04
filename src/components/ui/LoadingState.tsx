import { cn } from "@/lib/utils";

/**
 * Quiet, editorial loading placeholder used ahead of live data (e.g. the
 * Olympiads list before it is wired to the database). Deliberately not a
 * generic spinner — a breathing hairline block matches the rest of the
 * visual language.
 */
export function LoadingState({
  label = "Loading",
  className,
  lines = 3,
}: {
  label?: string;
  className?: string;
  lines?: number;
}) {
  return (
    <div className={cn("flex flex-col gap-3", className)} role="status" aria-live="polite">
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          className="h-16 w-full animate-pulse rounded-lg border border-border bg-elevated"
          style={{ animationDelay: `${i * 120}ms` }}
        />
      ))}
      <span className="sr-only">{label}</span>
    </div>
  );
}
