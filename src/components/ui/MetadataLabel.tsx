import { cn } from "@/lib/utils";

/**
 * Small, uppercase, mono-spaced label used for eyebrows and metadata
 * strips — e.g. "Founded 2025", "03 / Olympiads". Evokes the register
 * of a stamped academic document rather than a UI chip.
 */
export function MetadataLabel({
  children,
  className,
  muted = false,
}: {
  children: React.ReactNode;
  className?: string;
  muted?: boolean;
}) {
  return (
    <span
      className={cn(
        "font-mono text-[11px] uppercase tracking-[0.22em]",
        muted ? "text-muted" : "text-accent",
        className
      )}
    >
      {children}
    </span>
  );
}
