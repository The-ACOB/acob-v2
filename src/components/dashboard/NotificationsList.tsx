"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { useToast } from "@/components/dashboard/Toast";

export type NotificationRow = {
  id: string;
  type: string;
  title: string;
  body: string | null;
  createdAt: string;
  readAt: string | null;
};

export function NotificationsList({
  notifications,
  initialPrefs,
}: {
  notifications: NotificationRow[];
  initialPrefs: { emailEnabled: boolean; inAppEnabled: boolean };
}) {
  const [prefs, setPrefs] = useState(initialPrefs);
  const [savingPrefs, setSavingPrefs] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  const unreadCount = notifications.filter((n) => !n.readAt).length;

  async function markRead(id: string) {
    const res = await fetch("/api/notifications/mark-read", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    if (res.ok) router.refresh();
  }

  async function markAllRead() {
    const res = await fetch("/api/notifications/mark-read", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ all: true }),
    });
    if (res.ok) {
      toast("success", "All notifications marked as read");
      router.refresh();
    }
  }

  async function savePrefs(next: typeof prefs) {
    setPrefs(next);
    setSavingPrefs(true);
    const res = await fetch("/api/notifications/preferences", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(next),
    });
    setSavingPrefs(false);
    if (res.ok) toast("success", "Preferences updated");
  }

  return (
    <div className="flex flex-col gap-10">
      <section>
        <div className="mb-4 flex items-center justify-between">
          <p className="text-sm text-secondary">
            {unreadCount > 0 ? `${unreadCount} unread` : "You're all caught up"}
          </p>
          {unreadCount > 0 ? (
            <Button variant="ghost" className="text-xs" onClick={markAllRead}>
              Mark all as read
            </Button>
          ) : null}
        </div>

        {notifications.length === 0 ? (
          <EmptyState title="No notifications yet" description="Updates about approvals, messages, and more will appear here." />
        ) : (
          <div className="flex flex-col divide-y divide-border rounded-lg border border-border">
            {notifications.map((n) => (
              <div key={n.id} className="flex items-start justify-between gap-4 px-4 py-4">
                <div>
                  <div className="flex items-center gap-2">
                    {!n.readAt ? <span className="h-1.5 w-1.5 rounded-full bg-accent" /> : null}
                    <p className="text-sm text-primary">{n.title}</p>
                  </div>
                  {n.body ? <p className="mt-1 text-xs text-secondary">{n.body}</p> : null}
                  <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.1em] text-muted">
                    {new Date(n.createdAt).toLocaleString()}
                  </p>
                </div>
                {!n.readAt ? (
                  <button
                    type="button"
                    onClick={() => markRead(n.id)}
                    className="shrink-0 text-xs text-accent underline underline-offset-4"
                  >
                    Mark read
                  </button>
                ) : (
                  <Badge tone="neutral">Read</Badge>
                )}
              </div>
            ))}
          </div>
        )}
      </section>

      <section>
        <h2 className="mb-4 font-display text-lg text-primary">Preferences</h2>
        <div className="flex flex-col gap-4 rounded-lg border border-border bg-elevated p-5">
          <label className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm text-primary">In-app notifications</p>
              <p className="text-xs text-muted">Show notifications in the dashboard bell menu.</p>
            </div>
            <input
              type="checkbox"
              checked={prefs.inAppEnabled}
              disabled={savingPrefs}
              onChange={(e) => savePrefs({ ...prefs, inAppEnabled: e.target.checked })}
              className="h-4 w-4 accent-[var(--color-accent)]"
            />
          </label>
          <label className="flex items-center justify-between gap-4 border-t border-border pt-4">
            <div>
              <p className="text-sm text-primary">Email notifications</p>
              <p className="text-xs text-muted">Receive an email for supported events.</p>
            </div>
            <input
              type="checkbox"
              checked={prefs.emailEnabled}
              disabled={savingPrefs}
              onChange={(e) => savePrefs({ ...prefs, emailEnabled: e.target.checked })}
              className="h-4 w-4 accent-[var(--color-accent)]"
            />
          </label>
        </div>
      </section>
    </div>
  );
}
