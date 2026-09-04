import type { ReactNode } from "react";
import { MetadataLabel } from "@/components/ui/MetadataLabel";

export function AuthCard({
  eyebrow,
  title,
  description,
  children,
  footer,
}: {
  eyebrow: string;
  title: string;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <div>
      <MetadataLabel>{eyebrow}</MetadataLabel>
      <h1 className="mt-3 font-display text-3xl tracking-tight text-primary">{title}</h1>
      {description ? <p className="mt-3 text-sm leading-relaxed text-secondary">{description}</p> : null}
      <div className="mt-8">{children}</div>
      {footer ? <div className="mt-8 border-t border-border pt-6 text-sm text-secondary">{footer}</div> : null}
    </div>
  );
}
