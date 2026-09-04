"use client";

import { motion, useReducedMotion } from "motion/react";

/**
 * Signature hero graphic. A quiet orbital/constellation diagram — thin
 * concentric paths, small nodes, restrained glow — standing in for the
 * idea of knowledge orbiting a single point of curiosity rather than a
 * generic abstract blob. Purely decorative; hidden from assistive tech.
 */
export function OrbitalDiagram({ className }: { className?: string }) {
  const prefersReducedMotion = useReducedMotion();

  return (
    <svg
      viewBox="0 0 900 900"
      fill="none"
      aria-hidden="true"
      className={className}
    >
      <defs>
        <radialGradient id="acob-glow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="var(--color-accent)" stopOpacity="0.22" />
          <stop offset="55%" stopColor="var(--color-accent)" stopOpacity="0.05" />
          <stop offset="100%" stopColor="var(--color-accent)" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="acob-line" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="var(--color-border-strong)" />
          <stop offset="100%" stopColor="var(--color-accent)" stopOpacity="0.5" />
        </linearGradient>
      </defs>

      <circle cx="450" cy="450" r="360" fill="url(#acob-glow)" />

      {/* Static orbit rings */}
      {[130, 210, 300, 390].map((r) => (
        <circle
          key={r}
          cx="450"
          cy="450"
          r={r}
          stroke="var(--color-border-strong)"
          strokeOpacity="0.5"
          strokeWidth="1"
        />
      ))}

      {/* Center point — the origin of curiosity */}
      <circle cx="450" cy="450" r="5" fill="var(--color-accent)" />
      <circle cx="450" cy="450" r="14" stroke="var(--color-accent)" strokeOpacity="0.4" strokeWidth="1" />

      {/* Orbiting node group 1 */}
      <motion.g
        style={{ transformOrigin: "450px 450px" }}
        animate={prefersReducedMotion ? undefined : { rotate: 360 }}
        transition={{ duration: 60, repeat: Infinity, ease: "linear" }}
      >
        <circle cx="450" cy="90" r="4.5" fill="var(--color-accent)" />
        <circle cx="450" cy="90" r="10" stroke="var(--color-accent)" strokeOpacity="0.35" strokeWidth="1" />
      </motion.g>

      {/* Orbiting node group 2 (opposite direction, different radius) */}
      <motion.g
        style={{ transformOrigin: "450px 450px" }}
        animate={prefersReducedMotion ? undefined : { rotate: -360 }}
        transition={{ duration: 85, repeat: Infinity, ease: "linear" }}
      >
        <circle cx="150" cy="450" r="3.5" fill="var(--color-text-secondary)" />
        <path
          d="M150 450 L 210 450"
          stroke="url(#acob-line)"
          strokeWidth="1"
          strokeDasharray="2 4"
        />
      </motion.g>

      {/* Orbiting node group 3 */}
      <motion.g
        style={{ transformOrigin: "450px 450px" }}
        animate={prefersReducedMotion ? undefined : { rotate: 360 }}
        transition={{ duration: 110, repeat: Infinity, ease: "linear" }}
      >
        <circle cx="660" cy="588" r="4" fill="var(--color-accent)" fillOpacity="0.8" />
      </motion.g>

      {/* Fine radiating construction lines — academic diagram feel */}
      {[45, 135, 225, 315].map((angle) => {
        const rad = (angle * Math.PI) / 180;
        const x2 = 450 + 390 * Math.cos(rad);
        const y2 = 450 + 390 * Math.sin(rad);
        return (
          <line
            key={angle}
            x1="450"
            y1="450"
            x2={x2}
            y2={y2}
            stroke="var(--color-border)"
            strokeWidth="1"
            strokeDasharray="1 6"
          />
        );
      })}
    </svg>
  );
}
