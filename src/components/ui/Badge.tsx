import { cn } from "@/lib/utils";

type Tone = "neutral" | "accent" | "success" | "warning" | "error";

const toneClasses: Record<Tone, string> = {
  neutral: "border-border text-secondary",
  accent: "border-accent/40 text-accent",
  success: "border-success/40 text-success",
  warning: "border-warning/40 text-warning",
  error: "border-error/40 text-error",
};

export function Badge({
  children,
  tone = "neutral",
  className,
}: {
  children: React.ReactNode;
  tone?: Tone;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 font-mono text-[10px] uppercase tracking-[0.16em]",
        toneClasses[tone],
        className
      )}
    >
      {children}
    </span>
  );
}
