import Link from "next/link";
import { ChevronRight } from "lucide-react";

export function Breadcrumbs({ items }: { items: { label: string; href?: string }[] }) {
  return (
    <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs text-muted">
      {items.map((item, i) => (
        <span key={i} className="flex items-center gap-1.5">
          {i > 0 ? <ChevronRight className="h-3 w-3" strokeWidth={2} /> : null}
          {item.href ? (
            <Link href={item.href} className="transition-colors hover:text-secondary">
              {item.label}
            </Link>
          ) : (
            <span className="text-secondary">{item.label}</span>
          )}
        </span>
      ))}
    </nav>
  );
}
