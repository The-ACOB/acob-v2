export function DashboardSkeleton({ rows = 4 }: { rows?: number }) {
  return (
    <div className="flex flex-col gap-3" role="status" aria-live="polite">
      <div className="h-8 w-48 animate-pulse rounded-md bg-elevated" />
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="h-14 w-full animate-pulse rounded-lg border border-border bg-elevated" style={{ animationDelay: `${i * 100}ms` }} />
      ))}
      <span className="sr-only">Loading</span>
    </div>
  );
}

export function StatCardSkeleton() {
  return <div className="h-28 w-full animate-pulse rounded-lg border border-border bg-elevated" />;
}
