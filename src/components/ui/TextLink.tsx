import Link from "next/link";
import { cn } from "@/lib/utils";

export function TextLink({
  href,
  children,
  className,
}: {
  href: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "relative text-secondary transition-colors duration-200 hover:text-primary",
        "after:absolute after:-bottom-0.5 after:left-0 after:h-px after:w-0 after:bg-accent after:transition-all after:duration-300 hover:after:w-full",
        className
      )}
    >
      {children}
    </Link>
  );
}
