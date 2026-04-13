"use client";

import { Building, MapPin, Suitcase, Trash } from "iconoir-react";
import type { Experience } from "@/lib/candidate-store";
import { Field, YearSelect } from "./profile-primitives";

export function ExperienceForm({
  exp,
  onChange,
  onRemove,
}: {
  exp: Experience;
  onChange: (patch: Partial<Experience>) => void;
  onRemove: () => void;
}) {
  const yearOptions = (() => {
    const current = new Date().getFullYear();
    const years: number[] = [];
    for (let y = current; y >= current - 40; y--) years.push(y);
    return years;
  })();

  return (
    <div className="rounded-xl border border-[var(--border)] bg-white p-4 flex flex-col gap-3">
      <div className="flex items-start gap-3">
        <span className="size-9 rounded-xl bg-[var(--background-alt)] border border-[var(--border)] flex items-center justify-center text-foreground/60 shrink-0">
          <Suitcase width={14} height={14} strokeWidth={2} />
        </span>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 flex-1 min-w-0">
          <Field
            icon={Building}
            placeholder={"Intitul\u00e9 du poste"}
            value={exp.title}
            onChange={(v) => onChange({ title: v })}
          />
          <Field
            icon={Building}
            placeholder="Entreprise"
            value={exp.company}
            onChange={(v) => onChange({ company: v })}
          />
        </div>
        <button
          type="button"
          onClick={onRemove}
          className="size-9 rounded-full hover:bg-foreground/5 text-foreground/40 hover:text-destructive transition-colors flex items-center justify-center shrink-0"
          aria-label={"Retirer cette exp\u00e9rience"}
        >
          <Trash width={13} height={13} strokeWidth={2} />
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pl-12">
        <Field
          icon={MapPin}
          placeholder="Lieu (Monaco, Paris…)"
          value={exp.location ?? ""}
          onChange={(v) => onChange({ location: v })}
        />

        <YearSelect
          value={exp.startYear}
          onChange={(v) => onChange({ startYear: v })}
          options={yearOptions}
          label={"Ann\u00e9e de d\u00e9but"}
        />

        {exp.current ? (
          <div className="flex items-center gap-2 h-11 px-3.5 text-[12.5px] text-foreground/70">
            <span>Jusqu&apos;à aujourd&apos;hui</span>
          </div>
        ) : (
          <YearSelect
            value={exp.endYear ?? new Date().getFullYear()}
            onChange={(v) => onChange({ endYear: v })}
            options={yearOptions}
            label={"Ann\u00e9e de fin"}
          />
        )}
      </div>

      <label className="flex items-center gap-2 pl-12 text-[12px] text-foreground/75 cursor-pointer select-none">
        <span
          className="wall-check"
          data-checked={exp.current}
        />
        <input
          type="checkbox"
          checked={exp.current}
          onChange={(e) =>
            onChange({
              current: e.target.checked,
              endYear: e.target.checked ? undefined : exp.endYear ?? new Date().getFullYear(),
            })
          }
          className="sr-only"
        />
        Poste actuel
      </label>

      <div className="pl-12">
        <textarea
          placeholder={"Quelques lignes pour d\u00e9crire ton r\u00f4le, tes r\u00e9alisations, le contexte\u2026"}
          value={exp.description ?? ""}
          onChange={(e) => onChange({ description: e.target.value })}
          rows={3}
          className="w-full bg-white border border-[var(--border)] rounded-xl px-3.5 py-2.5 text-[13px] outline-none placeholder:text-[var(--tertiary-foreground)] focus:border-[var(--accent)] focus:shadow-[0_0_0_3px_oklch(0.355_0.066_247_/_0.12)] transition-all leading-[1.55] resize-y"
        />
      </div>
    </div>
  );
}
