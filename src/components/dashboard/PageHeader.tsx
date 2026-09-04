import type { ReactNode } from "react";
import { Breadcrumbs } from "./Breadcrumbs";

export function DashboardPageHeader({
  title,
  description,
  breadcrumbs,
  actions,
}: {
  title: string;
  description?: string;
  breadcrumbs?: { label: string; href?: string }[];
  actions?: ReactNode;
}) {
  return (
    <div className="mb-8 flex flex-col gap-4 border-b border-border pb-6 sm:flex-row sm:items-end sm:justify-between">
      <div>
        {breadcrumbs ? <Breadcrumbs items={breadcrumbs} /> : null}
        <h1 className="mt-2 font-display text-2xl tracking-tight text-primary sm:text-3xl">{title}</h1>
        {description ? <p className="mt-2 max-w-xl text-sm leading-relaxed text-secondary">{description}</p> : null}
      </div>
      {actions ? <div className="flex shrink-0 items-center gap-3">{actions}</div> : null}
    </div>
  );
}
