import type { LucideIcon } from "lucide-react";

export function StatCard({
  label,
  value,
  icon: Icon,
  hint,
}: {
  label: string;
  value: string | number;
  icon?: LucideIcon;
  hint?: string;
}) {
  return (
    <div className="rounded-lg border border-border bg-elevated px-5 py-5">
      <div className="flex items-center justify-between">
        <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted">{label}</p>
        {Icon ? <Icon className="h-4 w-4 text-muted" strokeWidth={1.75} /> : null}
      </div>
      <p className="mt-3 font-display text-3xl text-primary">{value}</p>
      {hint ? <p className="mt-1 text-xs text-secondary">{hint}</p> : null}
    </div>
  );
}
