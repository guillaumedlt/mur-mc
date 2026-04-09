"use client";

import type { ComponentType, SVGProps } from "react";

type Tone = "muted" | "accent" | "fresh" | "danger";

type Props = {
  icon: ComponentType<SVGProps<SVGSVGElement>>;
  label: string;
  value: string | number;
  hint?: string;
  tone?: Tone;
};

export function MiniStats({ icon: Icon, label, value, hint, tone = "muted" }: Props) {
  const tile =
    tone === "accent"
      ? "bg-[var(--accent)]/10 text-[var(--accent)]"
      : tone === "fresh"
        ? "bg-[oklch(0.92_0.12_145_/_0.18)] text-[oklch(0.42_0.13_145)]"
        : tone === "danger"
          ? "bg-[var(--destructive)]/10 text-[var(--destructive)]"
          : "bg-[var(--background-alt)] text-foreground/60";

  return (
    <div className="bg-white border border-[var(--border)] rounded-2xl p-4 flex items-center gap-3">
      <span className={`size-10 rounded-xl flex items-center justify-center ${tile}`}>
        <Icon width={16} height={16} strokeWidth={2} />
      </span>
      <div className="min-w-0">
        <div className="text-[11px] uppercase tracking-[0.08em] text-foreground/55 font-medium">
          {label}
        </div>
        <div className="font-display text-[22px] tracking-[-0.01em] text-foreground tabular-nums">
          {value}
        </div>
        {hint && (
          <div className="text-[11px] text-muted-foreground mt-0.5">{hint}</div>
        )}
      </div>
    </div>
  );
}
