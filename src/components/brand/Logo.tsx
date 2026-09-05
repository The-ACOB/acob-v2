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
    <div
      className={cn("relative flex items-center overflow-visible", className)}
    >
      <Image
        src="/assets/logo.png"
        alt="Applied Cognitio Olympiad Bangladesh"
        width={320}
        height={80}
        priority={priority}
        className="h-16 w-auto max-w-none -my-3 -ml-2 object-contain"
      />
    </div>
  );

  if (href === null) return mark;

  return (
    <Link
      href={href}
      aria-label="ACOB home"
      className="inline-flex items-center overflow-visible"
    >
      {mark}
    </Link>
  );
}
