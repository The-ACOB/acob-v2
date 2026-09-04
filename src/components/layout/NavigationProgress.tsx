"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

export function NavigationProgress() {
  const pathname = usePathname();
  const [startPath, setStartPath] = useState<string | null>(null);
  const active = startPath !== null && startPath === pathname;
  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      const target = (event.target as Element).closest("a");
      if (
        !target ||
        target.target === "_blank" ||
        target.origin !== window.location.origin ||
        target.pathname === window.location.pathname
      )
        return;
      setStartPath(pathname);
    };
    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, [pathname]);
  return (
    <div
      aria-hidden="true"
      className={`pointer-events-none fixed inset-x-0 top-0 z-[9999] h-1 origin-left overflow-hidden bg-accent transition-opacity duration-150 ${active ? "opacity-100" : "opacity-0"}`}
      style={
        active
          ? { animation: "acob-navigation-progress 900ms ease-in-out infinite" }
          : undefined
      }
    />
  );
}
