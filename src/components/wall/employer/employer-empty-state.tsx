"use client";

import Link from "next/link";
import type { ComponentType, SVGProps } from "react";

type Props = {
  icon: ComponentType<SVGProps<SVGSVGElement>>;
  title: string;
  description?: string;
  ctaLabel?: string;
  ctaHref?: string;
  onCta?: () => void;
};

export function EmployerEmptyState({
  icon: Icon,
  title,
  description,
  ctaLabel,
  ctaHref,
  onCta,
}: Props) {
  return (
    <div className="bg-white border border-[var(--border)] rounded-2xl p-12 text-center">
      <span className="inline-flex size-14 rounded-2xl bg-[var(--background-alt)] text-foreground/55 items-center justify-center">
        <Icon width={22} height={22} strokeWidth={1.6} />
      </span>
      <p className="font-display italic text-[18px] text-foreground mt-4">
        {title}
      </p>
      {description && (
        <p className="text-[13px] text-muted-foreground mt-2 max-w-sm mx-auto">
          {description}
        </p>
      )}
      {ctaLabel &&
        (ctaHref ? (
          <Link
            href={ctaHref}
            className="inline-flex h-10 mt-5 px-5 rounded-full bg-foreground text-background text-[13px] items-center"
          >
            {ctaLabel}
          </Link>
        ) : (
          <button
            type="button"
            onClick={onCta}
            className="inline-flex h-10 mt-5 px-5 rounded-full bg-foreground text-background text-[13px] items-center"
          >
            {ctaLabel}
          </button>
        ))}
    </div>
  );
}
