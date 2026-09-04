import { MobileSidebar } from "./MobileSidebar";
import { CommandMenu } from "./CommandMenu";
import { NotificationsMenu, type NotificationItem } from "./NotificationsMenu";
import { AccountMenu } from "@/components/layout/AccountMenu";
import { ThemeSwitcher } from "@/components/theme/ThemeSwitcher";

export function DashboardHeader({
  roleKeys,
  roleLabel,
  user,
  notifications,
}: {
  roleKeys: string[];
  roleLabel: string;
  user: { email: string; fullName: string | null };
  notifications: NotificationItem[];
}) {
  return (
    <header className="sticky top-0 z-40 flex h-16 items-center justify-between border-b border-border bg-background/90 px-6 backdrop-blur-md">
      <div className="flex items-center gap-4">
        <MobileSidebar roleKeys={roleKeys} roleLabel={roleLabel} />
        <div className="hidden lg:block">
          <CommandMenu roleKeys={roleKeys} />
        </div>
      </div>

      <div className="flex items-center gap-3">
        <NotificationsMenu notifications={notifications} />
        <ThemeSwitcher />
        <AccountMenu user={user} />
      </div>
    </header>
  );
}
