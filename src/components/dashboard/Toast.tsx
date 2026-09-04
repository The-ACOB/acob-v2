"use client";

import { createContext, useCallback, useContext, useState, type ReactNode } from "react";
import { AnimatePresence, motion } from "motion/react";
import { CheckCircle2, XCircle, Info, X } from "lucide-react";
import { cn } from "@/lib/utils";

type ToastTone = "success" | "error" | "info";
type ToastItem = { id: string; tone: ToastTone; title: string; description?: string };

type ToastContextValue = {
  toast: (tone: ToastTone, title: string, description?: string) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

const ICONS: Record<ToastTone, typeof CheckCircle2> = {
  success: CheckCircle2,
  error: XCircle,
  info: Info,
};

const TONE_CLASSES: Record<ToastTone, string> = {
  success: "text-success",
  error: "text-error",
  info: "text-accent",
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);

  const toast = useCallback((tone: ToastTone, title: string, description?: string) => {
    const id = Math.random().toString(36).slice(2);
    setItems((prev) => [...prev, { id, tone, title, description }]);
    setTimeout(() => {
      setItems((prev) => prev.filter((t) => t.id !== id));
    }, 5000);
  }, []);

  const dismiss = (id: string) => setItems((prev) => prev.filter((t) => t.id !== id));

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div className="pointer-events-none fixed bottom-6 right-6 z-[100] flex w-full max-w-sm flex-col gap-2">
        <AnimatePresence>
          {items.map((item) => {
            const Icon = ICONS[item.tone];
            return (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 12, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, x: 40 }}
                transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                className="pointer-events-auto flex items-start gap-3 rounded-lg border border-border-strong bg-elevated px-4 py-3.5 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.6)]"
              >
                <Icon className={cn("mt-0.5 h-4 w-4 shrink-0", TONE_CLASSES[item.tone])} strokeWidth={1.75} />
                <div className="flex-1">
                  <p className="text-sm text-primary">{item.title}</p>
                  {item.description ? <p className="mt-0.5 text-xs text-secondary">{item.description}</p> : null}
                </div>
                <button
                  type="button"
                  onClick={() => dismiss(item.id)}
                  aria-label="Dismiss"
                  className="text-muted transition-colors hover:text-primary"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within a ToastProvider");
  return ctx;
}
