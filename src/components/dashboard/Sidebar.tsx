"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Logo } from "@/components/brand/Logo";
import { resolveNavSections } from "@/lib/dashboard/nav-config";
import { cn } from "@/lib/utils";

export function Sidebar({ roleKeys, roleLabel }: { roleKeys: string[]; roleLabel: string }) {
  const sections = resolveNavSections(roleKeys);
  const pathname = usePathname();

  return (
    <aside className="hidden w-64 shrink-0 flex-col border-r border-border bg-background lg:flex">
      <div className="flex h-16 items-center border-b border-border px-6">
        <Logo href="/" className="h-6" />
      </div>

      <nav className="flex-1 overflow-y-auto px-4 py-6">
        {sections.map((section) => (
          <div key={section.label} className="mb-6">
            <p className="mb-2 px-2 font-mono text-[10px] uppercase tracking-[0.2em] text-muted">
              {section.label}
            </p>
            <ul className="flex flex-col gap-0.5">
              {section.items.map((item) => {
                const active = pathname === item.href;
                const Icon = item.icon;
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className={cn(
                        "flex items-center gap-3 rounded-md px-2.5 py-2 text-[13px] transition-colors",
                        active
                          ? "bg-elevated text-primary"
                          : "text-secondary hover:bg-elevated/60 hover:text-primary"
                      )}
                    >
                      <Icon className="h-[15px] w-[15px] shrink-0" strokeWidth={1.75} />
                      <span className="truncate">{item.label}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      <div className="border-t border-border px-6 py-4">
        <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted">{roleLabel}</p>
      </div>
    </aside>
  );
}
