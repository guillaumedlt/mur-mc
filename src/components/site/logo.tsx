import Link from "next/link";

export function Logo({
  href = "/",
  className = "",
}: {
  href?: string;
  className?: string;
}) {
  return (
    <Link
      href={href}
      className={`font-display text-[18px] font-semibold leading-none tracking-[-0.02em] text-foreground ${className}`}
    >
      hellowork.mc
    </Link>
  );
}
