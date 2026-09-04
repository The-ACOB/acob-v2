import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type SectionProps = {
  children: ReactNode;
  className?: string;
  id?: string;
  /** Visually separates this section from the one before it with a hairline. */
  bordered?: boolean;
};

export function Section({ children, className, id, bordered }: SectionProps) {
  return (
    <section
      id={id}
      className={cn(
        "relative py-24 sm:py-28 lg:py-36",
        bordered && "border-t border-border",
        className
      )}
    >
      {children}
    </section>
  );
}
