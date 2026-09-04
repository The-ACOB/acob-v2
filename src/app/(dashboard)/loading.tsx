export default function DashboardLoading() {
  return (
    <div
      className="flex min-h-48 items-center justify-center"
      role="status"
      aria-live="polite"
    >
      <p className="text-sm text-muted">Loading...</p>
    </div>
  );
}
