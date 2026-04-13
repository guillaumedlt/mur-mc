"use client";

/**
 * Shared UI primitives for the profile editor.
 */

import { Xmark } from "iconoir-react";

export function Card({
  title,
  icon: Icon,
  children,
}: {
  title: string;
  icon?: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  children: React.ReactNode;
}) {
  return (
    <section className="bg-white border border-[var(--border)] rounded-2xl px-7 py-6">
      <div className="flex items-center gap-2 mb-4">
        {Icon && (
          <Icon
            width={13}
            height={13}
            strokeWidth={2}
            className="text-foreground/55"
          />
        )}
        <h2 className="ed-label-sm">{title}</h2>
      </div>
      <div className="flex flex-col gap-3">{children}</div>
    </section>
  );
}

export function Field({
  icon: Icon,
  type = "text",
  placeholder,
  value,
  onChange,
}: {
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  type?: string;
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <label className="wall-input h-11 cursor-text">
      <Icon
        width={14}
        height={14}
        strokeWidth={2}
        className="text-[var(--tertiary-foreground)] shrink-0"
      />
      <input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="flex-1 bg-transparent outline-none text-[13.5px] placeholder:text-[var(--tertiary-foreground)]"
      />
    </label>
  );
}

export function Textarea({
  placeholder,
  value,
  onChange,
  rows = 4,
}: {
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
  rows?: number;
}) {
  return (
    <textarea
      placeholder={placeholder}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      rows={rows}
      className="bg-white border border-[var(--border)] rounded-xl px-3.5 py-3 text-[13.5px] outline-none placeholder:text-[var(--tertiary-foreground)] focus:border-[var(--accent)] focus:shadow-[0_0_0_3px_oklch(0.355_0.066_247_/_0.12)] transition-all leading-[1.6] resize-y"
    />
  );
}

export function YearSelect({
  value,
  onChange,
  options,
  label,
}: {
  value: number;
  onChange: (v: number) => void;
  options: number[];
  label: string;
}) {
  return (
    <select
      aria-label={label}
      value={value}
      onChange={(e) => onChange(parseInt(e.target.value, 10))}
      className="wall-select h-11"
    >
      {options.map((y) => (
        <option key={y} value={y}>
          {y}
        </option>
      ))}
    </select>
  );
}

export function SkillChip({
  skill,
  onRemove,
}: {
  skill: string;
  onRemove: () => void;
}) {
  return (
    <span className="inline-flex items-center gap-1 h-7 pl-2.5 pr-1 rounded-full bg-[var(--background-alt)] border border-[var(--border)] text-[11.5px] text-foreground">
      {skill}
      <button
        type="button"
        onClick={onRemove}
        className="size-4 rounded-full hover:bg-foreground/10 flex items-center justify-center text-foreground/50 hover:text-foreground transition-colors"
        aria-label={`Retirer ${skill}`}
      >
        <Xmark width={10} height={10} strokeWidth={2.2} />
      </button>
    </span>
  );
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} o`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} Ko`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`;
}

export function formatRelative(iso: string): string {
  const d = new Date(iso);
  const diffDays = Math.round(
    (Date.now() - d.getTime()) / (1000 * 60 * 60 * 24),
  );
  if (diffDays <= 0) return "aujourd'hui";
  if (diffDays === 1) return "hier";
  if (diffDays < 30) return `il y a ${diffDays} j`;
  return `il y a ${Math.round(diffDays / 30)} mois`;
}
