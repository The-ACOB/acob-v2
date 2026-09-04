"use client";

import { useEffect, useRef, useState } from "react";
import { Bell } from "lucide-react";
import { cn } from "@/lib/utils";

export type NotificationItem = {
  id: string;
  title: string;
  body: string | null;
  createdAt: string;
  readAt: string | null;
};

export function NotificationsMenu({ notifications }: { notifications: NotificationItem[] }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const unread = notifications.filter((n) => !n.readAt).length;

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label="Notifications"
        aria-haspopup="menu"
        aria-expanded={open}
        className="relative flex h-9 w-9 items-center justify-center rounded-full text-secondary transition-colors hover:text-primary"
      >
        <Bell className="h-[18px] w-[18px]" strokeWidth={1.75} />
        {unread > 0 ? (
          <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-accent" />
        ) : null}
      </button>

      <div
        role="menu"
        className={cn(
          "absolute right-0 top-11 w-80 origin-top-right rounded-lg border border-border-strong bg-elevated shadow-[0_20px_60px_-15px_rgba(0,0,0,0.6)] transition-all duration-150",
          open ? "pointer-events-auto scale-100 opacity-100" : "pointer-events-none scale-95 opacity-0"
        )}
      >
        <div className="border-b border-border px-4 py-3">
          <p className="text-sm text-primary">Notifications</p>
        </div>
        <div className="max-h-80 overflow-y-auto">
          {notifications.length === 0 ? (
            <p className="px-4 py-8 text-center text-xs text-muted">You&apos;re all caught up.</p>
          ) : (
            notifications.map((n) => (
              <div key={n.id} className="border-b border-border px-4 py-3 last:border-b-0">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm text-primary">{n.title}</p>
                  {!n.readAt ? <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" /> : null}
                </div>
                {n.body ? <p className="mt-1 text-xs text-secondary">{n.body}</p> : null}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
