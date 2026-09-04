"use client";

import { motion, useScroll, useTransform, useReducedMotion } from "motion/react";

/**
 * Small vertical line-and-dot indicator in the lower hero, fading out
 * as the person starts scrolling — a quiet invitation rather than a
 * literal "scroll down" label.
 */
export function ScrollCue() {
  const prefersReducedMotion = useReducedMotion();
  const { scrollY } = useScroll();
  const opacity = useTransform(scrollY, [0, 240], [1, 0]);

  return (
    <motion.div
      aria-hidden
      style={prefersReducedMotion ? undefined : { opacity }}
      className="pointer-events-none absolute bottom-10 left-1/2 hidden -translate-x-1/2 flex-col items-center gap-3 sm:flex"
    >
      <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-muted">Scroll</span>
      <motion.div
        className="h-10 w-px bg-gradient-to-b from-border-strong to-transparent"
        initial={{ scaleY: 0 }}
        animate={{ scaleY: 1 }}
        transition={{ duration: 1, delay: 1.4, ease: [0.16, 1, 0.3, 1] }}
        style={{ transformOrigin: "top" }}
      />
    </motion.div>
  );
}
