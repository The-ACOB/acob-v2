"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { logoutAction } from "@/lib/auth/actions";
import { cn } from "@/lib/utils";

type HeaderUser = { email: string; fullName: string | null };

function initials(user: HeaderUser): string {
  const source = user.fullName?.trim() || user.email;
  const parts = source.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return source.slice(0, 2).toUpperCase();
}

/**
 * Compact account trigger — an initials badge that opens a small menu,
 * replacing the old inline "Sign out (full email)" text that made the
 * header feel cluttered.
 */
export function AccountMenu({ user }: { user: HeaderUser }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Account menu"
        className="flex h-8 w-8 items-center justify-center rounded-full border border-border-strong font-mono text-[11px] uppercase tracking-widest text-primary transition-colors hover:border-accent"
      >
        {initials(user)}
      </button>

      <div
        role="menu"
        className={cn(
          "absolute right-0 top-11 w-56 origin-top-right rounded-lg border border-border-strong bg-elevated py-2 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.6)] transition-all duration-150",
          open ? "pointer-events-auto scale-100 opacity-100" : "pointer-events-none scale-95 opacity-0"
        )}
      >
        <div className="border-b border-border px-4 py-3">
          <p className="truncate text-sm text-primary">{user.fullName ?? "Account"}</p>
          <p className="truncate text-xs text-muted">{user.email}</p>
        </div>
        <Link
          href="/dashboard"
          role="menuitem"
          className="block px-4 py-2.5 text-sm text-secondary transition-colors hover:bg-elevated-2 hover:text-primary"
        >
          Dashboard
        </Link>
        <form action={logoutAction}>
          <button
            type="submit"
            role="menuitem"
            className="block w-full px-4 py-2.5 text-left text-sm text-secondary transition-colors hover:bg-elevated-2 hover:text-primary"
          >
            Sign out
          </button>
        </form>
      </div>
    </div>
  );
}
