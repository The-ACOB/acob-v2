"use client";

import { motion, useReducedMotion } from "motion/react";
import { Fragment } from "react";

/**
 * Splits text into words and reveals them with a slight vertical
 * stagger and blur-in, for a more deliberate typographic entrance on
 * the hero headline than a single fade. Falls back to a plain static
 * render under reduced motion.
 */
export function WordReveal({
  text,
  className,
  delay = 0,
}: {
  text: string;
  className?: string;
  delay?: number;
}) {
  const prefersReducedMotion = useReducedMotion();
  const words = text.split(" ");

  if (prefersReducedMotion) {
    return <span className={className}>{text}</span>;
  }

  return (
    <span className={className}>
      {words.map((word, i) => (
        <Fragment key={i}>
          <motion.span
            initial={{ opacity: 0, y: 18, filter: "blur(6px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            transition={{
              duration: 0.7,
              delay: delay + i * 0.06,
              ease: [0.16, 1, 0.3, 1],
            }}
            className="inline-block"
          >
            {word}
          </motion.span>
          {i < words.length - 1 ? " " : ""}
        </Fragment>
      ))}
    </span>
  );
}
