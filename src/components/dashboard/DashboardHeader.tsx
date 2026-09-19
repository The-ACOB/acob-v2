import type { NotificationItem } from "./NotificationsMenu";
import { NotificationsMenu } from "./NotificationsMenu";

export function DashboardHeader({
  roleKeys,
  roleLabel,
  user,
  notifications,
}: {
  roleKeys: string[];
  roleLabel: string;
  user: {
    email: string;
    fullName: string | null;
    avatarUrl?: string | null;
  };
  notifications: NotificationItem[];
}) {
  const displayName = user.fullName ?? user.email;
  const initials = displayName.substring(0, 2).toUpperCase();

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-border bg-background/90 px-6 backdrop-blur-md sm:px-8 lg:px-10">
      <div className="flex items-center gap-3">
        <span className="rounded-full bg-accent/10 px-3 py-1 text-xs font-medium text-accent">
          {roleLabel}
        </span>
      </div>

      <div className="flex items-center gap-4">
        <NotificationsMenu notifications={notifications} />
        <div className="flex items-center gap-3 border-l border-border pl-4">
          {user.avatarUrl ? (
            <img
              src={user.avatarUrl}
              alt={displayName}
              className="h-8 w-8 rounded-full object-cover border border-border"
            />
          ) : (
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-accent/20 text-xs font-semibold text-accent border border-border">
              {initials}
            </div>
          )}
          <div className="hidden flex-col text-left sm:flex">
            <span className="text-xs font-medium text-primary">
              {user.fullName ?? "User"}
            </span>
            <span className="text-[11px] text-secondary">{user.email}</span>
          </div>
        </div>
      </div>
    </header>
  );
}
