import Link from "next/link";
import type { AnchorHTMLAttributes, ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";

const base =
  "group relative inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full font-sans text-sm font-medium tracking-tight transition-all duration-300 ease-out focus-visible:outline focus-visible:outline-1 focus-visible:outline-accent focus-visible:outline-offset-4 disabled:pointer-events-none disabled:opacity-40";

const variants = {
  primary: "bg-primary text-background px-6 py-3 hover:bg-accent-strong",
  secondary:
    "border border-border-strong text-primary px-6 py-3 hover:border-accent hover:text-accent",
  ghost: "text-secondary px-1 py-1 hover:text-primary",
};

type Variant = keyof typeof variants;

type CommonProps = {
  children: ReactNode;
  variant?: Variant;
  className?: string;
};

type ButtonAsButton = CommonProps &
  ButtonHTMLAttributes<HTMLButtonElement> & { href?: undefined };

type ButtonAsLink = CommonProps &
  AnchorHTMLAttributes<HTMLAnchorElement> & { href: string };

export function Button(props: ButtonAsButton | ButtonAsLink) {
  const { children, variant = "primary", className, ...rest } = props;
  const classes = cn(base, variants[variant], className);

  if ("href" in props && props.href) {
    const { href, ...anchorRest } = rest as AnchorHTMLAttributes<HTMLAnchorElement> & {
      href: string;
    };
    return (
      <Link href={href} className={classes} {...anchorRest}>
        {children}
      </Link>
    );
  }

  return (
    <button className={classes} {...(rest as ButtonHTMLAttributes<HTMLButtonElement>)}>
      {children}
    </button>
  );
}
