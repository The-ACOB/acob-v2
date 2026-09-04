import { cn } from "@/lib/utils";

export function FormField({
  label,
  htmlFor,
  error,
  children,
  className,
}: {
  label: string;
  htmlFor: string;
  error?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <label
        htmlFor={htmlFor}
        className="font-mono text-[11px] uppercase tracking-[0.16em] text-muted"
      >
        {label}
      </label>
      {children}
      {error ? (
        <p role="alert" className="text-xs text-error">
          {error}
        </p>
      ) : null}
    </div>
  );
}

export const fieldClasses =
  "w-full rounded-md border border-border-strong bg-elevated px-4 py-3 text-sm text-primary placeholder:text-muted transition-colors duration-200 focus:border-accent focus:outline-none";
