"use client";

import { Suspense, useEffect, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";

function NavigationProgressInner() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);
  const [isFading, setIsFading] = useState(false);

  useEffect(() => {
    if (!isLoading) return;

    const fadeTimer = setTimeout(() => {
      setIsFading(true);
    }, 0);

    const finishTimer = setTimeout(() => {
      setIsLoading(false);
      setIsFading(false);
    }, 200);

    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(finishTimer);
    };
  }, [isLoading, pathname, searchParams]);

  useEffect(() => {
    let timeout: ReturnType<typeof setTimeout> | undefined;
    let finishTimeout: ReturnType<typeof setTimeout> | undefined;

    const onClick = (event: MouseEvent) => {
      const target = (event.target as Element).closest("a");

      if (
        !target ||
        target.target === "_blank" ||
        target.origin !== window.location.origin ||
        (target.pathname === window.location.pathname &&
          target.search === window.location.search)
      ) {
        return;
      }

      setIsFading(false);
      setIsLoading(true);

      if (timeout) clearTimeout(timeout);
      if (finishTimeout) clearTimeout(finishTimeout);

      timeout = setTimeout(() => {
        setIsFading(true);

        finishTimeout = setTimeout(() => {
          setIsLoading(false);
          setIsFading(false);
        }, 200);
      }, 5000);
    };

    document.addEventListener("click", onClick);

    return () => {
      document.removeEventListener("click", onClick);

      if (timeout) clearTimeout(timeout);
      if (finishTimeout) clearTimeout(finishTimeout);
    };
  }, []);

  if (!isLoading) return null;

  return (
    <div
      aria-hidden="true"
      className={`pointer-events-none fixed inset-x-0 top-0 z-[9999] h-1 origin-left overflow-hidden bg-accent transition-opacity duration-200 ${
        isFading ? "opacity-0" : "opacity-100"
      }`}
      style={{
        animation:
          "acob-navigation-progress 2s cubic-bezier(0.1, 0.6, 0.1, 1) forwards",
      }}
    />
  );
}

export function NavigationProgress() {
  return (
    <Suspense fallback={null}>
      <NavigationProgressInner />
    </Suspense>
  );
}
