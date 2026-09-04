import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";

export function Logo({
  className,
  href = "/",
  priority = false,
}: {
  className?: string;
  href?: string | null;
  priority?: boolean;
}) {
  const mark = (
    <Image
      src="/assets/logo.png"
      alt="Applied Cognitio Olympiad Bangladesh"
      width={160}
      height={40}
      priority={priority}
      className={cn("h-8 w-auto object-contain", className)}
    />
  );

  if (href === null) return mark;

  return (
    <Link
      href={href}
      aria-label="ACOB home"
      className="inline-flex items-center"
    >
      {mark}
    </Link>
  );
}
