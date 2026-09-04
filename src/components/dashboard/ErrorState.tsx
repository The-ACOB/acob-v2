import { AlertTriangle } from "lucide-react";

export function ErrorState({ title = "Something went wrong", description }: { title?: string; description?: string }) {
  return (
    <div className="flex flex-col items-start gap-3 rounded-lg border border-error/30 bg-error/5 px-6 py-10 sm:px-10">
      <AlertTriangle className="h-5 w-5 text-error" strokeWidth={1.75} />
      <h3 className="font-display text-xl text-primary">{title}</h3>
      {description ? <p className="max-w-md text-sm text-secondary">{description}</p> : null}
    </div>
  );
}
