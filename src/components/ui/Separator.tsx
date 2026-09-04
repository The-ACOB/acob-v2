"use client";

import { motion, useReducedMotion } from "motion/react";
import { cn } from "@/lib/utils";

/**
 * A hairline rule that draws itself in on scroll — used between major
 * sections instead of a hard visual break, echoing the fine-line motif
 * used throughout the hero diagram.
 */
export function AnimatedSeparator({ className }: { className?: string }) {
  const prefersReducedMotion = useReducedMotion();

  return (
    <div className={cn("relative h-px w-full overflow-hidden bg-border", className)}>
      <motion.div
        className="absolute inset-y-0 left-0 w-full bg-gradient-to-r from-transparent via-accent to-transparent"
        initial={{ scaleX: 0, opacity: 0 }}
        whileInView={{ scaleX: 1, opacity: prefersReducedMotion ? 0 : 0.6 }}
        viewport={{ once: true }}
        transition={{ duration: 1.1, ease: [0.16, 1, 0.3, 1] }}
        style={{ transformOrigin: "left" }}
      />
    </div>
  );
}
