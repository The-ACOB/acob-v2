"use client";

import { motion, useReducedMotion, type Variants } from "motion/react";
import type { ReactNode } from "react";

type RevealProps = {
  children: ReactNode;
  /** Stagger index — later elements in a sequence reveal slightly after earlier ones. */
  order?: number;
  /** Visual weight of the reveal. "major" is reserved for hero/section headings. */
  weight?: "major" | "standard" | "minor";
  className?: string;
  as?: "div" | "section" | "span";
};

const distanceByWeight: Record<NonNullable<RevealProps["weight"]>, number> = {
  major: 28,
  standard: 18,
  minor: 10,
};

/**
 * Scroll-triggered reveal used across the site to create an intentional
 * animation hierarchy (hero -> major headings -> supporting content).
 * Falls back to an instant, motion-free appearance for reduced-motion users.
 */
export function Reveal({
  children,
  order = 0,
  weight = "standard",
  className,
  as = "div",
}: RevealProps) {
  const prefersReducedMotion = useReducedMotion();
  const distance = distanceByWeight[weight];

  const variants: Variants = {
    hidden: {
      opacity: 0,
      y: prefersReducedMotion ? 0 : distance,
    },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: prefersReducedMotion ? 0.01 : weight === "major" ? 0.9 : 0.6,
        delay: prefersReducedMotion ? 0 : order * 0.08,
        ease: [0.16, 1, 0.3, 1],
      },
    },
  };

  const MotionTag = motion[as];

  return (
    <MotionTag
      className={className}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-10% 0% -10% 0%" }}
      variants={variants}
    >
      {children}
    </MotionTag>
  );
}
