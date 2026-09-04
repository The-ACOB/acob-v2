"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import { Menu, X } from "lucide-react";
import { Logo } from "@/components/brand/Logo";
import { resolveNavSections } from "@/lib/dashboard/nav-config";
import { cn } from "@/lib/utils";

export function MobileSidebar({ roleKeys, roleLabel }: { roleKeys: string[]; roleLabel: string }) {
  const sections = resolveNavSections(roleKeys);
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  const [prevPathname, setPrevPathname] = useState(pathname);
  if (pathname !== prevPathname) {
    setPrevPathname(pathname);
    if (open) setOpen(false);
  }

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <div className="lg:hidden">
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Open navigation"
        className="flex h-9 w-9 items-center justify-center text-primary"
      >
        <Menu className="h-5 w-5" strokeWidth={1.75} />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[60] bg-background"
          >
            <div className="flex h-16 items-center justify-between border-b border-border px-6">
              <Logo href="/" className="h-6" />
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close navigation"
                className="flex h-9 w-9 items-center justify-center text-primary"
              >
                <X className="h-5 w-5" strokeWidth={1.75} />
              </button>
            </div>

            <nav className="h-[calc(100dvh-4rem)] overflow-y-auto px-6 py-6">
              {sections.map((section) => (
                <div key={section.label} className="mb-7">
                  <p className="mb-3 font-mono text-[10px] uppercase tracking-[0.2em] text-muted">
                    {section.label}
                  </p>
                  <ul className="flex flex-col gap-1">
                    {section.items.map((item) => {
                      const active = pathname === item.href;
                      const Icon = item.icon;
                      return (
                        <li key={item.href}>
                          <Link
                            href={item.href}
                            className={cn(
                              "flex items-center gap-3 rounded-md px-3 py-3 text-base transition-colors",
                              active ? "bg-elevated text-primary" : "text-secondary"
                            )}
                          >
                            <Icon className="h-[18px] w-[18px] shrink-0" strokeWidth={1.75} />
                            {item.label}
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              ))}
              <p className="mt-4 font-mono text-[10px] uppercase tracking-[0.18em] text-muted">{roleLabel}</p>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
