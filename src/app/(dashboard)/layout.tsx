import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentSession } from "@/lib/auth/session";
import { db } from "@/lib/db/client";
import { primaryRoleLabel } from "@/lib/dashboard/nav-config";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { ToastProvider } from "@/components/dashboard/Toast";
import type { NotificationItem } from "@/components/dashboard/NotificationsMenu";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await getCurrentSession();
  if (!session) redirect("/login?next=/dashboard");

  const roleLabel = primaryRoleLabel(session.roleKeys);

  const rawNotifications = await db.notification.findMany({
    where: { userId: session.id },
    orderBy: { createdAt: "desc" },
    take: 8,
  });

  const notifications: NotificationItem[] = rawNotifications.map((n: {
    id: string;
    title: string;
    body: string | null;
    createdAt: Date;
    readAt: Date | null;
  }) => ({
    id: n.id,
    title: n.title,
    body: n.body,
    createdAt: n.createdAt.toISOString(),
    readAt: n.readAt ? n.readAt.toISOString() : null,
  }));

  return (
    <ToastProvider>
      <div className="flex min-h-dvh">
        <Sidebar roleKeys={session.roleKeys} roleLabel={roleLabel} />
        <div className="flex min-w-0 flex-1 flex-col">
          <DashboardHeader
            roleKeys={session.roleKeys}
            roleLabel={roleLabel}
            user={{ email: session.email, fullName: session.fullName }}
            notifications={notifications}
          />
          <main className="flex-1 px-6 py-8 sm:px-8 lg:px-10">{children}</main>
        </div>
      </div>
    </ToastProvider>
  );
}
