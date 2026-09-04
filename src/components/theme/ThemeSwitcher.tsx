"use client";

import { useTheme, type Theme } from "./ThemeProvider";

export function ThemeSwitcher() {
  const { theme, setTheme } = useTheme();
  return (
    <label className="flex items-center gap-2 text-xs text-secondary">
      <span>Theme</span>
      <select
        aria-label="Theme"
        value={theme}
        onChange={(event) => setTheme(event.target.value as Theme)}
        className="rounded-md border border-border-strong bg-elevated px-2 py-1 text-xs text-primary"
      >
        <option value="system">System</option>
        <option value="light">Light</option>
        <option value="dark">Dark</option>
      </select>
    </label>
  );
}
