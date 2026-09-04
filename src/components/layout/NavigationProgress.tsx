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
      className={`fixed inset-x-0 top-0 z-[100] h-0.5 origin-left bg-accent transition-transform duration-200 ${active ? "scale-x-100 opacity-100" : "scale-x-0 opacity-0"}`}
    />
  );
}
