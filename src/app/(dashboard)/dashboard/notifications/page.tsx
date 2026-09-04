import type { Metadata } from "next";
import { getCurrentSession } from "@/lib/auth/session";
import { db } from "@/lib/db/client";
import { DashboardPageHeader } from "@/components/dashboard/PageHeader";
import { NotificationsList, type NotificationRow } from "@/components/dashboard/NotificationsList";

export const metadata: Metadata = { title: "Notifications" };

export default async function NotificationsPage() {
  const session = await getCurrentSession();
  if (!session) return null;

  const [rawNotifications, prefs] = await Promise.all([
    db.notification.findMany({ where: { userId: session.id }, orderBy: { createdAt: "desc" }, take: 50 }),
    db.notificationPreference.findUnique({ where: { userId: session.id } }),
  ]);

  const notifications: NotificationRow[] = rawNotifications.map((n: {
    id: string;
    type: string;
    title: string;
    body: string | null;
    createdAt: Date;
    readAt: Date | null;
  }) => ({
    id: n.id,
    type: n.type,
    title: n.title,
    body: n.body,
    createdAt: n.createdAt.toISOString(),
    readAt: n.readAt ? n.readAt.toISOString() : null,
  }));

  return (
    <div>
      <DashboardPageHeader
        title="Notifications"
        breadcrumbs={[{ label: "Dashboard", href: "/dashboard" }, { label: "Notifications" }]}
      />
      <NotificationsList
        notifications={notifications}
        initialPrefs={{
          emailEnabled: prefs?.emailEnabled ?? true,
          inAppEnabled: prefs?.inAppEnabled ?? true,
        }}
      />
    </div>
  );
}
