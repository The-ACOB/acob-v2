"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { Monitor, Moon, Sun } from "lucide-react";

type Theme = "light" | "dark" | "system";

const THEME_KEY = "acob-theme";

function getStoredTheme(): Theme {
  if (typeof window === "undefined") {
    return "system";
  }

  const stored = window.localStorage.getItem(THEME_KEY);

  if (stored === "light" || stored === "dark" || stored === "system") {
    return stored;
  }

  return "system";
}

function getSystemTheme(): "light" | "dark" {
  if (typeof window === "undefined") {
    return "dark";
  }

  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

function applyTheme(theme: Theme) {
  if (typeof document === "undefined") {
    return;
  }

  const resolvedTheme = theme === "system" ? getSystemTheme() : theme;

  document.documentElement.classList.toggle("dark", resolvedTheme === "dark");

  document.documentElement.classList.toggle("light", resolvedTheme === "light");

  document.documentElement.style.colorScheme = resolvedTheme;
}

function subscribeToTheme(callback: () => void) {
  if (typeof window === "undefined") {
    return () => {};
  }

  const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");

  const handleChange = () => {
    callback();
  };

  mediaQuery.addEventListener("change", handleChange);

  return () => {
    mediaQuery.removeEventListener("change", handleChange);
  };
}

function getThemeSnapshot(): Theme {
  return getStoredTheme();
}

function getServerThemeSnapshot(): Theme {
  return "system";
}

export function ThemeSwitcher() {
  const theme = useSyncExternalStore(
    subscribeToTheme,
    getThemeSnapshot,
    getServerThemeSnapshot,
  );

  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  useEffect(() => {
    if (!open) {
      return;
    }

    const handlePointerDown = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  const handleThemeChange = (nextTheme: Theme) => {
    window.localStorage.setItem(THEME_KEY, nextTheme);
    applyTheme(nextTheme);

    window.dispatchEvent(new Event("acob-theme-change"));

    setOpen(false);
  };

  const currentIcon =
    theme === "light" ? (
      <Sun className="h-4 w-4" />
    ) : theme === "dark" ? (
      <Moon className="h-4 w-4" />
    ) : (
      <Monitor className="h-4 w-4" />
    );

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-label="Change theme"
        aria-expanded={open}
        className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-border bg-elevated text-secondary transition-colors hover:border-accent/40 hover:text-primary"
      >
        {currentIcon}
      </button>

      {open ? (
        <div className="absolute right-0 top-full z-50 mt-2 w-36 overflow-hidden rounded-xl border border-border bg-elevated p-1 shadow-xl">
          <button
            type="button"
            onClick={() => handleThemeChange("light")}
            className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-xs transition-colors ${
              theme === "light"
                ? "bg-accent/10 text-accent"
                : "text-secondary hover:bg-background hover:text-primary"
            }`}
          >
            <Sun className="h-4 w-4" />
            Light
          </button>

          <button
            type="button"
            onClick={() => handleThemeChange("dark")}
            className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-xs transition-colors ${
              theme === "dark"
                ? "bg-accent/10 text-accent"
                : "text-secondary hover:bg-background hover:text-primary"
            }`}
          >
            <Moon className="h-4 w-4" />
            Dark
          </button>

          <button
            type="button"
            onClick={() => handleThemeChange("system")}
            className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-xs transition-colors ${
              theme === "system"
                ? "bg-accent/10 text-accent"
                : "text-secondary hover:bg-background hover:text-primary"
            }`}
          >
            <Monitor className="h-4 w-4" />
            System
          </button>
        </div>
      ) : null}
    </div>
  );
}
