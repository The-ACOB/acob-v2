"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { resolveNavSections } from "@/lib/dashboard/nav-config";

export function CommandMenu({ roleKeys }: { roleKeys: string[] }) {
  const sections = resolveNavSections(roleKeys);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const router = useRouter();

  // Clear the search query whenever the palette closes. Adjusted at
  // render time (React's sanctioned pattern for resetting state in
  // response to a prop change) rather than in an effect.
  const [prevOpen, setPrevOpen] = useState(open);
  if (open !== prevOpen) {
    setPrevOpen(open);
    if (!open && query) setQuery("");
  }

  const allItems = useMemo(() => sections.flatMap((s) => s.items), [sections]);
  const filtered = query
    ? allItems.filter((i) => i.label.toLowerCase().includes(query.toLowerCase()))
    : allItems;

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((v) => !v);
      }
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 rounded-md border border-border-strong bg-elevated px-3 py-1.5 text-xs text-muted transition-colors hover:text-secondary"
      >
        <Search className="h-3.5 w-3.5" strokeWidth={1.75} />
        <span className="hidden sm:inline">Search</span>
        <kbd className="hidden rounded border border-border-strong px-1.5 py-0.5 font-mono text-[10px] sm:inline">
          ⌘K
        </kbd>
      </button>

      {open ? (
        <div className="fixed inset-0 z-[90] flex items-start justify-center bg-black/70 px-4 pt-24 backdrop-blur-sm" onClick={() => setOpen(false)}>
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-lg overflow-hidden rounded-lg border border-border-strong bg-elevated shadow-[0_30px_80px_-20px_rgba(0,0,0,0.7)]"
          >
            <div className="flex items-center gap-3 border-b border-border px-4 py-3">
              <Search className="h-4 w-4 text-muted" strokeWidth={1.75} />
              <input
                autoFocus
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Jump to a section..."
                className="flex-1 bg-transparent text-sm text-primary placeholder:text-muted focus:outline-none"
              />
              <kbd className="rounded border border-border-strong px-1.5 py-0.5 font-mono text-[10px] text-muted">Esc</kbd>
            </div>
            <div className="max-h-80 overflow-y-auto py-2">
              {filtered.length === 0 ? (
                <p className="px-4 py-6 text-center text-xs text-muted">No matches.</p>
              ) : (
                filtered.map((item) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.href}
                      type="button"
                      onClick={() => {
                        setOpen(false);
                        router.push(item.href);
                      }}
                      className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm text-secondary transition-colors hover:bg-elevated-2 hover:text-primary"
                    >
                      <Icon className="h-4 w-4" strokeWidth={1.75} />
                      {item.label}
                    </button>
                  );
                })
              )}
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
