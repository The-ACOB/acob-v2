"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { Button } from "@/components/ui/Button";

export type ActivePopup = {
  id: string;
  content: string;
  ctaLabel: string | null;
  ctaUrl: string | null;
};

const DISMISS_KEY_PREFIX = "acob-popup-dismissed:";

/**
 * A single slim, dismissible banner — never a blocking modal, never
 * re-shown after being dismissed within the same browser session.
 * This is the whole "avoid intrusive popups" requirement: it doesn't
 * cover content, doesn't trap focus, and goes away for good once closed.
 */
export function PopupBanner({ popup }: { popup: ActivePopup | null }) {
  const [dismissed, setDismissed] = useState(true);

  useEffect(() => {
    if (!popup) return;
    const key = DISMISS_KEY_PREFIX + popup.id;
    const alreadyDismissed = sessionStorage.getItem(key) === "1";
    queueMicrotask(() => setDismissed(alreadyDismissed));
  }, [popup]);

  if (!popup) return null;

  function dismiss() {
    if (popup) sessionStorage.setItem(DISMISS_KEY_PREFIX + popup.id, "1");
    setDismissed(true);
  }

  return (
    <AnimatePresence>
      {!dismissed ? (
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -12 }}
          transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
          className="relative z-[70] flex flex-wrap items-center justify-center gap-3 border-b border-border bg-elevated px-6 py-2.5 text-center text-xs text-secondary"
        >
          <span>{popup.content}</span>
          {popup.ctaLabel && popup.ctaUrl ? (
            <Button href={popup.ctaUrl} variant="ghost" className="px-2 py-0.5 text-xs text-accent">
              {popup.ctaLabel}
            </Button>
          ) : null}
          <button
            type="button"
            onClick={dismiss}
            aria-label="Dismiss"
            className="absolute right-4 top-1/2 -translate-y-1/2 text-muted transition-colors hover:text-primary"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
