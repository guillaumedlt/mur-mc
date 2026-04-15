"use client";

import { useState } from "react";
import {
  Bag,
  Building,
  Calendar,
  Clock,
  Filter as FilterIcon,
  Group,
  Language,
  NavArrowDown,
  Refresh,
  Sparks,
  Xmark,
} from "iconoir-react";
import type { ComponentType, SVGProps } from "react";
import type { Filters, MatchFilter, PostedBucket } from "./types";
import { isFiltersActive } from "./types";
import { useUser } from "@/lib/auth";
import { profileCompletion, useCandidate } from "@/lib/candidate-store";
import {
  type ExperienceBucket,
  type Job,
  type JobType,
  type Locale,
  type Sector,
  type WorkTime,
  daysSincePosted,
} from "@/lib/data";

type IconCmp = ComponentType<SVGProps<SVGSVGElement>>;

const CONTRACTS: JobType[] = [
  "CDI",
  "CDD",
  "Freelance",
  "Saison",
  "Stage",
  "Alternance",
];

const SECTORS: Sector[] = [
  "Banque & Finance",
  "Yachting",
  "Hôtellerie & Restauration",
  "Luxe & Retail",
  "Tech & Digital",
  "Immobilier",
  "Juridique",
  "Sport & Bien-être",
  "Événementiel",
  "Famille / Office",
  "Assurance",
  "Audit & Conseil",
  "BTP & Construction",
  "Commerce & Distribution",
  "Communication & Marketing",
  "Comptabilité",
  "Éducation & Formation",
  "Industrie",
  "Logistique & Transport",
  "Médical & Santé",
  "Ressources Humaines",
  "Sécurité",
  "Services à la personne",
  "Consulting",
  "Autre",
];

const QUICK_SECTORS: Sector[] = [
  "Banque & Finance",
  "Yachting",
  "Tech & Digital",
  "Hôtellerie & Restauration",
  "Luxe & Retail",
  "Communication & Marketing",
];

const EXPERIENCE: { value: ExperienceBucket; label: string }[] = [
  { value: "debutant", label: "Débutant" },
  { value: "1-3", label: "1 – 3 ans" },
  { value: "3-5", label: "3 – 5 ans" },
  { value: "5+", label: "5 ans et +" },
];

const LANGS: { value: Locale; label: string }[] = [
  { value: "fr", label: "Français" },
  { value: "en", label: "Anglais" },
];

const POSTED: { value: PostedBucket; label: string }[] = [
  { value: "today", label: "Aujourd'hui" },
  { value: "week", label: "Cette semaine" },
  { value: "month", label: "Ce mois" },
  { value: "all", label: "Tout" },
];

const WORKTIMES: WorkTime[] = ["Temps plein", "Temps partiel"];

type Props = {
  filters: Filters;
  setFilters: (f: Filters) => void;
  jobs: Job[];
  /** "drawer" : utilisé en mobile, plein écran sans sticky. */
  variant?: "default" | "drawer";
  onClose?: () => void;
};

export function FilterSidebar({
  filters,
  setFilters,
  jobs,
  variant = "default",
  onClose,
}: Props) {
  const isDrawer = variant === "drawer";
  const user = useUser();
  const { profile } = useCandidate();
  const isCandidate = user?.role === "candidate" && profileCompletion(profile) >= 30;
  const countContract = (t: JobType) => jobs.filter((j) => j.type === t).length;
  const countSector = (s: Sector) =>
    jobs.filter((j) => j.sector === s).length;
  const countLang = (l: Locale) => jobs.filter((j) => j.lang === l).length;
  const countWorkTime = (w: WorkTime) =>
    jobs.filter((j) => j.workTime === w).length;
  const countToday = jobs.filter((j) => daysSincePosted(j.postedAt) <= 1).length;

  const toggle = <T,>(set: Set<T>, v: T): Set<T> => {
    const next = new Set(set);
    if (next.has(v)) next.delete(v);
    else next.add(v);
    return next;
  };

  const reset = () =>
    setFilters({
      query: "",
      contracts: new Set(),
      sectors: new Set(),
      experience: new Set(),
      langs: new Set(),
      posted: "all",
      workTimes: new Set(),
      matchMin: "all",
    });

  return (
    <aside
      className={
        isDrawer
          ? "w-full min-h-screen bg-white"
          : "w-[272px] shrink-0 bg-white border border-[var(--border)] rounded-2xl max-h-[calc(100vh-92px)] sticky top-[80px] overflow-y-auto wall-scroll shadow-[0_1px_0_rgba(10,10,10,0.02)] [&::-webkit-scrollbar-track]:my-4"
      }
    >
      {isDrawer && (
        <div className="sticky top-0 z-10 bg-white/90 backdrop-blur-md border-b border-[var(--border)] flex items-center justify-between px-4 h-14">
          <div className="flex items-center gap-2 text-[13px] font-medium text-foreground">
            <FilterIcon width={14} height={14} strokeWidth={2} />
            Filtres
          </div>
          <button
            type="button"
            onClick={onClose}
            className="size-8 rounded-full hover:bg-foreground/5 flex items-center justify-center text-foreground/60"
            aria-label="Fermer"
          >
            <Xmark width={14} height={14} strokeWidth={2.2} />
          </button>
        </div>
      )}
      <div className="pl-3.5 pr-2 py-5 flex flex-col gap-4">
        {/* ── Stats card ─────────────────────────────────── */}
        <div className="rounded-2xl border border-[var(--border)] bg-white p-3.5 flex items-center gap-3">
          <div className="size-9 rounded-xl bg-[var(--accent)]/10 flex items-center justify-center text-[var(--accent)]">
            <Sparks width={16} height={16} strokeWidth={2} />
          </div>
          <div className="min-w-0">
            <div className="text-[12px] text-foreground/60 leading-tight">
              Marché monégasque
            </div>
            <div className="text-[14px] font-medium text-foreground">
              {jobs.length} offres ·{" "}
              <span className="text-[var(--accent)]">+{countToday} aujourd&apos;hui</span>
            </div>
          </div>
        </div>

        {/* ── Quick chips ────────────────────────────────── */}
        <div>
          <div className="ed-label-sm mb-2 px-1">Raccourcis</div>
          <div className="flex flex-wrap gap-1.5">
            {QUICK_SECTORS.map((s) => {
              const active = filters.sectors.has(s);
              return (
                <button
                  key={s}
                  type="button"
                  onClick={() =>
                    setFilters({
                      ...filters,
                      sectors: toggle(filters.sectors, s),
                    })
                  }
                  className={`h-7 px-2.5 rounded-full text-[11.5px] border transition-colors ${
                    active
                      ? "bg-foreground text-background border-foreground"
                      : "bg-white text-foreground/75 border-[var(--border)] hover:border-foreground/30 hover:text-foreground"
                  }`}
                >
                  {shortSector(s)}
                </button>
              );
            })}
          </div>
        </div>

        {/* ── Active filters chips ───────────────────────── */}
        {isFiltersActive(filters) && (
          <div className="rounded-2xl bg-[var(--accent)]/[0.04] border border-[var(--accent)]/15 p-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10.5px] uppercase tracking-[0.09em] text-[var(--accent)] font-semibold">
                Filtres actifs
              </span>
              <button
                type="button"
                onClick={reset}
                className="text-[11px] text-[var(--accent)] hover:underline underline-offset-2 inline-flex items-center gap-1"
              >
                <Refresh width={10} height={10} strokeWidth={2.2} />
                Tout effacer
              </button>
            </div>
            <div className="flex flex-wrap gap-1">
              {filters.query && (
                <Chip
                  label={`« ${filters.query} »`}
                  onRemove={() => setFilters({ ...filters, query: "" })}
                />
              )}
              {[...filters.contracts].map((c) => (
                <Chip
                  key={c}
                  label={c}
                  onRemove={() =>
                    setFilters({
                      ...filters,
                      contracts: toggle(filters.contracts, c),
                    })
                  }
                />
              ))}
              {[...filters.sectors].map((s) => (
                <Chip
                  key={s}
                  label={shortSector(s)}
                  onRemove={() =>
                    setFilters({
                      ...filters,
                      sectors: toggle(filters.sectors, s),
                    })
                  }
                />
              ))}
              {[...filters.experience].map((e) => (
                <Chip
                  key={e}
                  label={EXPERIENCE.find((x) => x.value === e)?.label || e}
                  onRemove={() =>
                    setFilters({
                      ...filters,
                      experience: toggle(filters.experience, e),
                    })
                  }
                />
              ))}
              {[...filters.langs].map((l) => (
                <Chip
                  key={l}
                  label={l.toUpperCase()}
                  onRemove={() =>
                    setFilters({
                      ...filters,
                      langs: toggle(filters.langs, l),
                    })
                  }
                />
              ))}
              {[...filters.workTimes].map((w) => (
                <Chip
                  key={w}
                  label={w}
                  onRemove={() =>
                    setFilters({
                      ...filters,
                      workTimes: toggle(filters.workTimes, w),
                    })
                  }
                />
              ))}
              {filters.posted !== "all" && (
                <Chip
                  label={POSTED.find((p) => p.value === filters.posted)?.label ?? filters.posted}
                  onRemove={() => setFilters({ ...filters, posted: "all" })}
                />
              )}
              {filters.matchMin !== "all" && (
                <Chip
                  label={filters.matchMin === "excellent" ? "Match 80%+" : "Match 60%+"}
                  onRemove={() => setFilters({ ...filters, matchMin: "all" })}
                />
              )}
            </div>
          </div>
        )}

        <Divider />

        {/* ── Groupes de filtres ─────────────────────────── */}
        {isCandidate && (
          <FilterGroup
            label="Compatibilite"
            icon={Sparks}
            activeCount={filters.matchMin !== "all" ? 1 : 0}
          >
            {(
              [
                { value: "all" as MatchFilter, label: "Toutes les offres" },
                { value: "good" as MatchFilter, label: "Bon match (60%+)" },
                { value: "excellent" as MatchFilter, label: "Excellent (80%+)" },
              ] as const
            ).map(({ value, label }) => (
              <RadioRow
                key={value}
                label={label}
                checked={filters.matchMin === value}
                onChange={() =>
                  setFilters({ ...filters, matchMin: value })
                }
              />
            ))}
          </FilterGroup>
        )}

        <FilterGroup
          label="Type de contrat"
          icon={Bag}
          activeCount={filters.contracts.size}
        >
          {CONTRACTS.map((t) => (
            <CheckRow
              key={t}
              label={t}
              count={countContract(t)}
              checked={filters.contracts.has(t)}
              onChange={() =>
                setFilters({
                  ...filters,
                  contracts: toggle(filters.contracts, t),
                })
              }
            />
          ))}
        </FilterGroup>

        <FilterGroup
          label="Secteur"
          icon={Building}
          activeCount={filters.sectors.size}
        >
          {SECTORS.map((s) => (
            <CheckRow
              key={s}
              label={s}
              count={countSector(s)}
              checked={filters.sectors.has(s)}
              onChange={() =>
                setFilters({
                  ...filters,
                  sectors: toggle(filters.sectors, s),
                })
              }
            />
          ))}
        </FilterGroup>

        <FilterGroup
          label="Expérience"
          icon={Group}
          activeCount={filters.experience.size}
        >
          {EXPERIENCE.map(({ value, label }) => (
            <CheckRow
              key={value}
              label={label}
              checked={filters.experience.has(value)}
              onChange={() =>
                setFilters({
                  ...filters,
                  experience: toggle(filters.experience, value),
                })
              }
            />
          ))}
        </FilterGroup>

        <FilterGroup
          label="Langue"
          icon={Language}
          activeCount={filters.langs.size}
        >
          {LANGS.map(({ value, label }) => (
            <CheckRow
              key={value}
              label={label}
              count={countLang(value)}
              checked={filters.langs.has(value)}
              onChange={() =>
                setFilters({
                  ...filters,
                  langs: toggle(filters.langs, value),
                })
              }
            />
          ))}
        </FilterGroup>

        <FilterGroup
          label="Publié"
          icon={Calendar}
          activeCount={filters.posted !== "all" ? 1 : 0}
        >
          {POSTED.map(({ value, label }) => (
            <RadioRow
              key={value}
              label={label}
              checked={filters.posted === value}
              onChange={() => setFilters({ ...filters, posted: value })}
            />
          ))}
        </FilterGroup>

        <FilterGroup
          label="Temps de travail"
          icon={Clock}
          activeCount={filters.workTimes.size}
          defaultOpen={false}
        >
          {WORKTIMES.map((w) => (
            <CheckRow
              key={w}
              label={w}
              count={countWorkTime(w)}
              checked={filters.workTimes.has(w)}
              onChange={() =>
                setFilters({
                  ...filters,
                  workTimes: toggle(filters.workTimes, w),
                })
              }
            />
          ))}
        </FilterGroup>

        <div className="h-2" />
      </div>
    </aside>
  );
}

function shortSector(s: Sector): string {
  const map: Partial<Record<Sector, string>> = {
    "Banque & Finance": "Finance",
    "Hôtellerie & Restauration": "Hôtellerie",
    "Luxe & Retail": "Luxe",
    "Tech & Digital": "Tech",
    "Sport & Bien-être": "Sport",
    "Famille / Office": "Family Office",
  };
  return map[s] ?? s;
}

function Chip({
  label,
  onRemove,
}: {
  label: string;
  onRemove: () => void;
}) {
  return (
    <span className="inline-flex items-center gap-1 h-6 pl-2 pr-1 rounded-full bg-white border border-[var(--accent)]/20 text-[11px] text-foreground">
      {label}
      <button
        type="button"
        onClick={onRemove}
        className="size-4 rounded-full hover:bg-foreground/10 flex items-center justify-center text-foreground/50 hover:text-foreground transition-colors"
        aria-label={`Retirer ${label}`}
      >
        <Xmark width={10} height={10} strokeWidth={2.2} />
      </button>
    </span>
  );
}

function Divider() {
  return <div className="h-px bg-[var(--border)] -mx-1" />;
}

function FilterGroup({
  label,
  icon: Icon,
  activeCount,
  defaultOpen = true,
  children,
}: {
  label: string;
  icon: IconCmp;
  activeCount: number;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="flex flex-col">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center justify-between gap-2 mb-1.5 px-2 py-1 rounded-lg text-foreground/85 hover:bg-foreground/[0.04] transition-colors group/group"
      >
        <span className="flex items-center gap-2 text-[11px] uppercase tracking-[0.09em] font-semibold text-foreground/70">
          <Icon width={12} height={12} strokeWidth={2} />
          {label}
        </span>
        <span className="flex items-center gap-1.5">
          {activeCount > 0 && (
            <span className="h-[18px] min-w-[18px] px-1 rounded-full bg-[var(--accent)] text-white text-[10px] font-mono font-medium flex items-center justify-center tabular-nums">
              {activeCount}
            </span>
          )}
          <NavArrowDown
            width={11}
            height={11}
            strokeWidth={2.2}
            className={`text-foreground/40 transition-transform duration-200 ${
              open ? "" : "-rotate-90"
            }`}
          />
        </span>
      </button>
      {open && <div className="flex flex-col">{children}</div>}
    </div>
  );
}

function CheckRow({
  label,
  count,
  checked,
  onChange,
}: {
  label: string;
  count?: number;
  checked: boolean;
  onChange: () => void;
}) {
  return (
    <label className="wall-filter-row group/row" data-checked={checked}>
      <span className="wall-check" data-checked={checked} />
      <input
        type="checkbox"
        className="sr-only"
        checked={checked}
        onChange={onChange}
      />
      <span
        className={`text-[13px] flex-1 transition-colors ${
          checked
            ? "text-foreground font-medium"
            : "text-foreground/80 group-hover/row:text-foreground"
        }`}
      >
        {label}
      </span>
      {typeof count === "number" && (
        <span className="text-[10.5px] font-mono text-[var(--tertiary-foreground)] tabular-nums">
          {count}
        </span>
      )}
    </label>
  );
}

function RadioRow({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: () => void;
}) {
  return (
    <label className="wall-filter-row group/row">
      <span className="wall-check" data-checked={checked} data-radio="true" />
      <input
        type="radio"
        className="sr-only"
        checked={checked}
        onChange={onChange}
      />
      <span
        className={`text-[13px] flex-1 transition-colors ${
          checked
            ? "text-foreground font-medium"
            : "text-foreground/80 group-hover/row:text-foreground"
        }`}
      >
        {label}
      </span>
    </label>
  );
}
