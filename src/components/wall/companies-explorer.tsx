"use client";

import { useState, useMemo } from "react";
import {
  Building,
  Filter as FilterIcon,
  NavArrowDown,
  Refresh,
  Search,
  SortDown,
  Sparks,
  Xmark,
} from "iconoir-react";
import type { Company, Sector } from "@/lib/data";
import { CompanyCard } from "./company-card";
import { FeaturedCompanies } from "./featured-companies";

type Props = {
  companies: Company[];
  counts: Record<string, number>;
};

type SortKey = "jobs" | "az" | "founded";

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
];

const SHORT_SECTOR: Partial<Record<Sector, string>> = {
  "Banque & Finance": "Finance",
  "Hôtellerie & Restauration": "Hôtellerie",
  "Luxe & Retail": "Luxe",
  "Tech & Digital": "Tech",
  "Sport & Bien-être": "Sport",
  "Famille / Office": "Family Office",
};

export function CompaniesExplorer({ companies, counts }: Props) {
  const [query, setQuery] = useState("");
  const [sectors, setSectors] = useState<Set<Sector>>(new Set());
  const [hiringOnly, setHiringOnly] = useState(false);
  const [sort, setSort] = useState<SortKey>("jobs");
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  const toggleSector = (s: Sector) => {
    const next = new Set(sectors);
    if (next.has(s)) next.delete(s);
    else next.add(s);
    setSectors(next);
  };

  const reset = () => {
    setQuery("");
    setSectors(new Set());
    setHiringOnly(false);
  };

  const isActive = query.length > 0 || sectors.size > 0 || hiringOnly;
  const totalJobs = Object.values(counts).reduce((a, b) => a + b, 0);
  const hiringCount = companies.filter((c) => (counts[c.id] ?? 0) > 0).length;

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = companies.filter((c) => {
      if (q) {
        const hay = `${c.name} ${c.sector} ${c.description} ${c.location}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      if (sectors.size > 0 && !sectors.has(c.sector)) return false;
      if (hiringOnly && (counts[c.id] ?? 0) === 0) return false;
      return true;
    });
    list.sort((a, b) => {
      if (sort === "jobs") return (counts[b.id] ?? 0) - (counts[a.id] ?? 0);
      if (sort === "az") return a.name.localeCompare(b.name);
      return (b.founded ?? 0) - (a.founded ?? 0);
    });
    return list;
  }, [companies, counts, query, sectors, hiringOnly, sort]);

  const countSector = (s: Sector) =>
    companies.filter((c) => c.sector === s).length;

  const filtersBody = (
    <div className="pl-3.5 pr-2 py-5 flex flex-col gap-4">
      {/* Stats card */}
      <div className="rounded-2xl border border-[var(--border)] bg-white p-3.5 flex items-center gap-3">
        <div className="size-9 rounded-xl bg-[var(--accent)]/10 flex items-center justify-center text-[var(--accent)]">
          <Building width={16} height={16} strokeWidth={2} />
        </div>
        <div className="min-w-0">
          <div className="text-[12px] text-foreground/60 leading-tight">
            Annuaire monégasque
          </div>
          <div className="text-[14px] font-medium text-foreground">
            {companies.length} entreprises ·{" "}
            <span className="text-[var(--accent)]">{totalJobs} offres</span>
          </div>
        </div>
      </div>

      {/* Quick chips */}
      <div>
        <div className="ed-label-sm mb-2 px-1">Raccourcis</div>
        <div className="flex flex-wrap gap-1.5">
          {QUICK_SECTORS.map((s) => {
            const active = sectors.has(s);
            return (
              <button
                key={s}
                type="button"
                onClick={() => toggleSector(s)}
                className={`h-7 px-2.5 rounded-full text-[11.5px] border transition-colors ${
                  active
                    ? "bg-foreground text-background border-foreground"
                    : "bg-white text-foreground/75 border-[var(--border)] hover:border-foreground/30 hover:text-foreground"
                }`}
              >
                {SHORT_SECTOR[s] ?? s}
              </button>
            );
          })}
        </div>
      </div>

      {/* Active filters block */}
      {isActive && (
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
            {query && (
              <Chip label={`« ${query} »`} onRemove={() => setQuery("")} />
            )}
            {hiringOnly && (
              <Chip
                label="Qui recrute"
                onRemove={() => setHiringOnly(false)}
              />
            )}
            {[...sectors].map((s) => (
              <Chip
                key={s}
                label={SHORT_SECTOR[s] ?? s}
                onRemove={() => toggleSector(s)}
              />
            ))}
          </div>
        </div>
      )}

      <Divider />

      {/* Statut group */}
      <FilterGroup
        label="Statut"
        icon={Sparks}
        activeCount={hiringOnly ? 1 : 0}
      >
        <CheckRow
          label="Qui recrute en ce moment"
          count={hiringCount}
          checked={hiringOnly}
          onChange={() => setHiringOnly((v) => !v)}
        />
      </FilterGroup>

      {/* Sector group */}
      <FilterGroup
        label="Secteur"
        icon={Building}
        activeCount={sectors.size}
      >
        {SECTORS.map((s) => (
          <CheckRow
            key={s}
            label={s}
            count={countSector(s)}
            checked={sectors.has(s)}
            onChange={() => toggleSector(s)}
          />
        ))}
      </FilterGroup>

      {/* Tri group */}
      <FilterGroup label="Tri" icon={SortDown} activeCount={0}>
        {(
          [
            ["jobs", "Plus d'offres ouvertes"],
            ["az", "Nom A–Z"],
            ["founded", "Plus récentes"],
          ] as const
        ).map(([k, l]) => (
          <RadioRow
            key={k}
            label={l}
            checked={sort === k}
            onChange={() => setSort(k)}
          />
        ))}
      </FilterGroup>

      <div className="h-2" />
    </div>
  );

  return (
    <div className="flex gap-3 items-start">
      {/* Drawer mobile */}
      {mobileFiltersOpen && (
        <div
          className="lg:hidden fixed inset-0 z-40 bg-foreground/30 backdrop-blur-[2px]"
          onClick={() => setMobileFiltersOpen(false)}
        >
          <aside
            className="absolute left-0 top-0 bottom-0 w-[88vw] max-w-[300px] bg-white shadow-[8px_0_30px_rgba(10,10,10,0.18)] overflow-y-auto wall-scroll"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 z-10 bg-white/90 backdrop-blur-md border-b border-[var(--border)] flex items-center justify-between px-4 h-14">
              <div className="flex items-center gap-2 text-[13px] font-medium text-foreground">
                <FilterIcon width={14} height={14} strokeWidth={2} />
                Filtres
              </div>
              <button
                type="button"
                onClick={() => setMobileFiltersOpen(false)}
                className="size-8 rounded-full hover:bg-foreground/5 flex items-center justify-center text-foreground/60"
                aria-label="Fermer"
              >
                <Xmark width={14} height={14} strokeWidth={2.2} />
              </button>
            </div>
            {filtersBody}
          </aside>
        </div>
      )}

      {/* ─── Sidebar desktop ─────────────────────────────── */}
      <aside className="hidden lg:block w-[272px] shrink-0 bg-white border border-[var(--border)] rounded-2xl max-h-[calc(100vh-92px)] sticky top-[80px] overflow-y-auto wall-scroll shadow-[0_1px_0_rgba(10,10,10,0.02)] [&::-webkit-scrollbar-track]:my-4">
        {filtersBody}
      </aside>

      {/* ─── Main column ─────────────────────────────────── */}
      <main className="flex-1 min-w-0 bg-white border border-[var(--border)] rounded-2xl px-4 sm:px-6 lg:px-7 py-5 lg:py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-5 sm:mb-6 gap-3 flex-wrap">
          <div className="flex items-baseline gap-2.5 min-w-0">
            <h1 className="font-display text-[22px] sm:text-[24px] lg:text-[26px] tracking-[-0.015em] text-foreground truncate">
              {filtered.length === companies.length
                ? "Entreprises de Monaco"
                : "Résultats"}
            </h1>
            <span className="wall-badge shrink-0" data-tone="muted">
              <span className="font-mono tabular-nums">{filtered.length}</span>
            </span>
          </div>

          <button
            type="button"
            onClick={() => setMobileFiltersOpen(true)}
            className="lg:hidden h-8 px-3 rounded-full border border-[var(--border)] bg-white text-[12.5px] text-foreground/80 hover:text-foreground hover:border-foreground/30 transition-colors flex items-center gap-1.5"
          >
            <FilterIcon width={12} height={12} strokeWidth={2} />
            Filtres
            {(sectors.size + (hiringOnly ? 1 : 0) + (query ? 1 : 0)) > 0 && (
              <span className="size-[18px] rounded-full bg-[var(--accent)] text-white text-[10px] font-mono font-medium flex items-center justify-center">
                {sectors.size + (hiringOnly ? 1 : 0) + (query ? 1 : 0)}
              </span>
            )}
          </button>

          {/* Inline search */}
          <div className="wall-input w-full sm:w-auto sm:min-w-[260px] sm:max-w-[360px]">
            <Search
              width={14}
              height={14}
              strokeWidth={2}
              className="text-[var(--tertiary-foreground)] shrink-0"
            />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Rechercher une entreprise…"
              className="flex-1 bg-transparent outline-none text-[13px] placeholder:text-[var(--tertiary-foreground)]"
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery("")}
                className="size-5 rounded-full hover:bg-foreground/10 flex items-center justify-center text-foreground/40 hover:text-foreground transition-colors"
                aria-label="Effacer"
              >
                <Xmark width={11} height={11} strokeWidth={2.4} />
              </button>
            )}
          </div>
        </div>

        {/* Featured hero — visible uniquement sans filtres */}
        {!isActive && sort === "jobs" && (() => {
          const featured = filtered.filter((c) => c.hasCover).slice(0, 3);
          const featuredIds = new Set(featured.map((c) => c.id));
          const standard = filtered.filter((c) => !featuredIds.has(c.id));

          return (
            <>
              <FeaturedCompanies companies={featured} counts={counts} />

              {standard.length === 0 && featured.length === 0 ? (
                <div className="py-20 text-center">
                  <p className="font-display italic text-[18px] text-foreground">
                    Aucune entreprise ne correspond à ces critères.
                  </p>
                  <button
                    type="button"
                    onClick={reset}
                    className="mt-4 text-[13px] text-[var(--accent)] hover:underline underline-offset-2"
                  >
                    Élargir la recherche
                  </button>
                </div>
              ) : (
                <div className="wall-grid" data-density="standard">
                  {standard.map((c, i) => (
                    <CompanyCard
                      key={c.id}
                      company={c}
                      jobCount={counts[c.id] ?? 0}
                      index={i}
                    />
                  ))}
                </div>
              )}
            </>
          );
        })()}

        {/* Grid standard — quand des filtres sont actifs */}
        {(isActive || sort !== "jobs") && (
          filtered.length === 0 ? (
            <div className="py-20 text-center">
              <p className="font-display italic text-[18px] text-foreground">
                Aucune entreprise ne correspond à ces critères.
              </p>
              <button
                type="button"
                onClick={reset}
                className="mt-4 text-[13px] text-[var(--accent)] hover:underline underline-offset-2"
              >
                Élargir la recherche
              </button>
            </div>
          ) : (
            <div className="wall-grid" data-density="standard">
              {filtered.map((c, i) => (
                <CompanyCard
                  key={c.id}
                  company={c}
                  jobCount={counts[c.id] ?? 0}
                  index={i}
                />
              ))}
            </div>
          )
        )}
      </main>
    </div>
  );
}

/* ─── Petits composants UI ─── (mêmes primitives que FilterSidebar) */

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

type IconCmp = React.ComponentType<React.SVGProps<SVGSVGElement>>;

function FilterGroup({
  label,
  icon: Icon,
  activeCount,
  children,
}: {
  label: string;
  icon: IconCmp;
  activeCount: number;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(true);
  return (
    <div className="flex flex-col">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center justify-between gap-2 mb-1.5 px-2 py-1 rounded-lg text-foreground/85 hover:bg-foreground/[0.04] transition-colors"
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
