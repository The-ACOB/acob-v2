"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import { Logo } from "@/components/brand/Logo";
import { TextLink } from "@/components/ui/TextLink";
import { logoutAction } from "@/lib/auth/actions";
import { AccountMenu } from "./AccountMenu";
import { NAV_LINKS } from "./nav-links";
import { cn } from "@/lib/utils";
import { ThemeSwitcher } from "@/components/theme/ThemeSwitcher";

type HeaderUser = { email: string; fullName: string | null } | null;

export function Header({ user = null }: { user?: HeaderUser }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  // Close the mobile menu when navigating to a new route. Adjusted at
  // render time (React's sanctioned pattern for resetting state in
  // response to a prop/route change) rather than in an effect.
  const [prevPathname, setPrevPathname] = useState(pathname);
  if (pathname !== prevPathname) {
    setPrevPathname(pathname);
    if (open) setOpen(false);
  }

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <header
      className={cn(
        "sticky top-0 z-50 w-full transition-colors duration-300",
        scrolled || open
          ? "border-b border-border bg-background/90 backdrop-blur-md"
          : "border-b border-transparent bg-transparent",
      )}
    >
      <div className="mx-auto flex h-16 w-full max-w-[1240px] items-center justify-between gap-6 px-6 sm:px-8 lg:px-10">
        <Logo priority className="h-7 shrink-0 sm:h-8" />

        <nav aria-label="Primary" className="hidden items-center gap-7 lg:flex">
          {NAV_LINKS.map((link) => (
            <TextLink
              key={link.href}
              href={link.href}
              className={cn(
                "text-[13px] font-medium tracking-tight",
                pathname === link.href && "text-primary after:w-full",
              )}
            >
              {link.label}
            </TextLink>
          ))}
        </nav>

        <div className="hidden shrink-0 items-center gap-5 lg:flex">
          <TextLink
            href="/verify"
            className="text-[13px] font-medium tracking-tight text-muted"
          >
            Verify
          </TextLink>
          {user ? (
            <AccountMenu user={user} />
          ) : (
            <TextLink
              href="/login"
              className="rounded-full border border-border-strong px-4 py-2 text-[13px] font-medium tracking-tight text-primary transition-colors after:hidden hover:border-accent"
            >
              Sign in
            </TextLink>
          )}
          <ThemeSwitcher />
        </div>

        <button
          type="button"
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
          aria-controls="mobile-nav"
          onClick={() => setOpen((v) => !v)}
          className="relative flex h-9 w-9 flex-col items-center justify-center gap-[5px] lg:hidden"
        >
          <span
            className={cn(
              "h-px w-5 bg-primary transition-transform duration-300",
              open && "translate-y-[3px] rotate-45",
            )}
          />
          <span
            className={cn(
              "h-px w-5 bg-primary transition-transform duration-300",
              open && "-translate-y-[3px] -rotate-45",
            )}
          />
        </button>
      </div>

      <AnimatePresence>
        {open && (
          <motion.div
            id="mobile-nav"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            className="overflow-hidden border-t border-border bg-background lg:hidden"
          >
            <nav
              aria-label="Mobile"
              className="flex flex-col gap-1 px-6 py-6 sm:px-8"
            >
              {NAV_LINKS.map((link, i) => (
                <motion.div
                  key={link.href}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.04, duration: 0.3 }}
                >
                  <TextLink
                    href={link.href}
                    className="block py-3 font-display text-2xl tracking-tight after:hidden"
                  >
                    {link.label}
                  </TextLink>
                </motion.div>
              ))}

              <div className="mt-4 flex flex-col gap-4 border-t border-border pt-5">
                <TextLink
                  href="/verify"
                  className="text-sm font-medium tracking-tight text-secondary after:hidden"
                >
                  Verify a certificate
                </TextLink>

                {user ? (
                  <>
                    <TextLink
                      href="/dashboard"
                      className="text-sm font-medium tracking-tight after:hidden"
                    >
                      Dashboard
                    </TextLink>
                    <form action={logoutAction}>
                      <button
                        type="submit"
                        className="text-left text-sm font-medium tracking-tight text-secondary transition-colors hover:text-primary"
                      >
                        Sign out
                      </button>
                    </form>
                  </>
                ) : (
                  <TextLink
                    href="/login"
                    className="w-fit rounded-full border border-border-strong px-4 py-2 text-sm font-medium tracking-tight after:hidden"
                  >
                    Sign in
                  </TextLink>
                )}
              </div>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
