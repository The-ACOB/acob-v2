"use client";

import { useEffect, useRef, useState } from "react";
import { Monitor, Moon, Sun, Check } from "lucide-react";
import { useTheme, type Theme } from "./ThemeProvider";

const OPTIONS: {
  value: Theme;
  label: string;
  description: string;
  icon: typeof Sun;
}[] = [
  {
    value: "system",
    label: "System",
    description: "Follow device",
    icon: Monitor,
  },
  {
    value: "light",
    label: "Light",
    description: "Daylight palette",
    icon: Sun,
  },
  {
    value: "dark",
    label: "Dark",
    description: "Low-light palette",
    icon: Moon,
  },
];

export function ThemeSwitcher() {
  const { theme, setTheme } = useTheme();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const active = OPTIONS.find((option) => option.value === theme) ?? OPTIONS[0];
  const ActiveIcon = active.icon;

  useEffect(() => {
    function close(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node))
        setOpen(false);
    }
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", close);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        aria-label={`Theme: ${active.label}`}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
        className="flex h-8 w-8 items-center justify-center rounded-full border border-border-strong text-secondary transition-colors duration-200 hover:border-accent hover:text-primary motion-safe:hover:rotate-[-8deg]"
      >
        <ActiveIcon className="h-4 w-4" strokeWidth={1.7} />
      </button>
      {open ? (
        <div
          role="menu"
          aria-label="Theme options"
          className="absolute right-0 top-11 z-[80] w-44 rounded-lg border border-border-strong bg-elevated p-1.5 shadow-[0_18px_50px_-20px_var(--color-glow)]"
        >
          {OPTIONS.map((option) => {
            const Icon = option.icon;
            const selected = option.value === theme;
            return (
              <button
                key={option.value}
                type="button"
                role="menuitemradio"
                aria-checked={selected}
                onClick={() => {
                  setTheme(option.value);
                  setOpen(false);
                }}
                className="flex w-full items-center gap-3 rounded-md px-2.5 py-2 text-left transition-colors duration-150 hover:bg-elevated-2"
              >
                <Icon
                  className="h-4 w-4 shrink-0 text-secondary"
                  strokeWidth={1.7}
                />
                <span className="min-w-0 flex-1">
                  <span className="block text-xs text-primary">
                    {option.label}
                  </span>
                  <span className="block text-[10px] text-muted">
                    {option.description}
                  </span>
                </span>
                {selected ? (
                  <Check className="h-3.5 w-3.5 text-accent" strokeWidth={2} />
                ) : null}
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
