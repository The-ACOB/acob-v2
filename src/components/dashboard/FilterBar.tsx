import type { ReactNode } from "react";

export function FilterBar({ children }: { children: ReactNode }) {
  return <div className="mb-5 flex flex-wrap items-center gap-3">{children}</div>;
}

export function FilterSelect({
  label,
  name,
  value,
  options,
}: {
  label: string;
  name: string;
  value?: string;
  options: { value: string; label: string }[];
}) {
  return (
    <label className="flex items-center gap-2 rounded-md border border-border-strong bg-elevated px-3 py-2 text-xs">
      <span className="font-mono uppercase tracking-[0.1em] text-muted">{label}</span>
      <select
        name={name}
        defaultValue={value ?? ""}
        className="bg-transparent text-secondary focus:outline-none"
      >
        <option value="">All</option>
        {options.map((opt) => (
          <option key={opt.value} value={opt.value} className="bg-elevated">
            {opt.label}
          </option>
        ))}
      </select>
    </label>
  );
}
