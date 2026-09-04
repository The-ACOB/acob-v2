"use client";

import { useRef } from "react";
import { motion, useMotionValue, useSpring, useTransform, useReducedMotion } from "motion/react";
import { OrbitalDiagram } from "./OrbitalDiagram";
import { cn } from "@/lib/utils";

/**
 * Wraps the hero orbital diagram with a subtle cursor-reactive tilt —
 * the diagram drifts a few degrees toward the pointer, like a slow
 * gyroscope, then eases back to center. Entirely inert for touch/no-JS
 * and skipped outright under reduced motion.
 */
export function ParallaxOrbital({ className }: { className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const prefersReducedMotion = useReducedMotion();

  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const springX = useSpring(mouseX, { stiffness: 60, damping: 20, mass: 0.6 });
  const springY = useSpring(mouseY, { stiffness: 60, damping: 20, mass: 0.6 });

  const rotateX = useTransform(springY, [-0.5, 0.5], [6, -6]);
  const rotateY = useTransform(springX, [-0.5, 0.5], [-6, 6]);
  const translateX = useTransform(springX, [-0.5, 0.5], [-14, 14]);
  const translateY = useTransform(springY, [-0.5, 0.5], [-14, 14]);

  function handleMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    if (prefersReducedMotion || !ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    mouseX.set((e.clientX - rect.left) / rect.width - 0.5);
    mouseY.set((e.clientY - rect.top) / rect.height - 0.5);
  }

  function handleMouseLeave() {
    mouseX.set(0);
    mouseY.set(0);
  }

  return (
    <div
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className={cn("[perspective:1200px]", className)}
    >
      <motion.div
        style={
          prefersReducedMotion
            ? undefined
            : { rotateX, rotateY, x: translateX, y: translateY }
        }
        className="h-full w-full"
      >
        <OrbitalDiagram className="h-full w-full" />
      </motion.div>
    </div>
  );
}
