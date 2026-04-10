"use client";

import { useMemo, useState } from "react";
import {
  Filter,
  List,
  NavArrowDown,
  SortDown,
  ViewColumns2,
  ViewColumns3,
  ViewGrid,
} from "iconoir-react";
import { TopBar } from "./top-bar";
import { FilterSidebar } from "./filter-sidebar";
import { JobCard } from "./job-card";
import { FeaturedJobs } from "./featured-jobs";
import { CommandPalette } from "./command-palette";
import { Footer } from "./footer";
import {
  type Density,
  type Filters,
  type SortKey,
  emptyFilters,
} from "./types";
import {
  type Job,
  daysSincePosted,
  experienceMatches,
} from "@/lib/data";
import { useUser } from "@/lib/auth";
import {
  matchScore as computeMatchScore,
  profileCompletion,
  useCandidate,
} from "@/lib/candidate-store";

type Props = {
  jobs: Job[];
};

export function Wall({ jobs }: Props) {
  const user = useUser();
  const { profile } = useCandidate();
  const isCandidate = user?.role === "candidate" && profileCompletion(profile) >= 30;

  const [filters, setFilters] = useState<Filters>(() => emptyFilters());
  const [sort, setSort] = useState<SortKey>("recent");
  const [density, setDensity] = useState<Density>("standard");
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [sortOpen, setSortOpen] = useState(false);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  const activeFilterCount =
    filters.contracts.size +
    filters.sectors.size +
    filters.experience.size +
    filters.langs.size +
    filters.workTimes.size +
    (filters.posted !== "all" ? 1 : 0) +
    (filters.query ? 1 : 0) +
    (filters.matchMin !== "all" ? 1 : 0);

  const filtered = useMemo(() => {
    const q = filters.query.trim().toLowerCase();
    const list = jobs.filter((j) => {
      if (q) {
        const hay = `${j.title} ${j.company.name} ${j.sector} ${j.shortDescription}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      if (filters.contracts.size && !filters.contracts.has(j.type)) return false;
      if (filters.sectors.size && !filters.sectors.has(j.sector)) return false;
      if (filters.langs.size && !filters.langs.has(j.lang)) return false;
      if (filters.workTimes.size && !filters.workTimes.has(j.workTime))
        return false;
      if (filters.experience.size) {
        const ok = Array.from(filters.experience).some((b) =>
          experienceMatches(j.level, b),
        );
        if (!ok) return false;
      }
      if (filters.posted !== "all") {
        const days = daysSincePosted(j.postedAt);
        if (filters.posted === "today" && days > 0) return false;
        if (filters.posted === "week" && days > 7) return false;
        if (filters.posted === "month" && days > 30) return false;
      }
      // Match filter : exclure les offres sous le seuil
      if (filters.matchMin !== "all" && isCandidate) {
        const score = computeMatchScore(j, profile);
        if (filters.matchMin === "excellent" && score < 80) return false;
        if (filters.matchMin === "good" && score < 60) return false;
      }
      return true;
    });

    // Si le sort est "match" mais l'user n'est pas candidat, fallback sur "recent"
    const effectiveSort = sort === "match" && !isCandidate ? "recent" : sort;

    list.sort((a, b) => {
      if (effectiveSort === "match" && isCandidate) {
        return (
          computeMatchScore(b, profile) - computeMatchScore(a, profile)
        );
      }
      if (effectiveSort === "recent")
        return b.postedAt.localeCompare(a.postedAt);
      if (effectiveSort === "old") return a.postedAt.localeCompare(b.postedAt);
      if (effectiveSort === "company")
        return a.company.name.localeCompare(b.company.name);
      return a.type.localeCompare(b.type);
    });

    return list;
  }, [jobs, filters, sort, isCandidate, profile]);

  // Sépare les featured du reste — les featured apparaissent dans le hero
  // uniquement quand aucun filtre n'est actif et tri par récent (vue par défaut).
  const showFeaturedHero = activeFilterCount === 0 && sort === "recent";
  const featuredJobs = showFeaturedHero
    ? filtered.filter((j) => j.featured).slice(0, 3)
    : [];
  const featuredIds = new Set(featuredJobs.map((j) => j.id));
  const standardJobs = showFeaturedHero
    ? filtered.filter((j) => !featuredIds.has(j.id))
    : filtered;

  return (
    <div className="min-h-screen bg-background p-3">
      <TopBar
        count={jobs.length}
        query={filters.query}
        setQuery={(query) => setFilters({ ...filters, query })}
        onOpenPalette={() => setPaletteOpen(true)}
      />

      <div className="flex gap-3 mt-3 items-start">
        {/* Sidebar desktop */}
        <div className="hidden lg:block">
          <FilterSidebar
            filters={filters}
            setFilters={setFilters}
            jobs={jobs}
          />
        </div>

        {/* Drawer mobile */}
        {mobileFiltersOpen && (
          <div
            className="lg:hidden fixed inset-0 z-40 bg-foreground/30 backdrop-blur-[2px]"
            onClick={() => setMobileFiltersOpen(false)}
          >
            <div
              className="absolute left-0 top-0 bottom-0 w-[88vw] max-w-[300px] bg-white border-r border-[var(--border)] shadow-[8px_0_30px_rgba(10,10,10,0.18)] overflow-y-auto wall-scroll"
              onClick={(e) => e.stopPropagation()}
            >
              <FilterSidebar
                filters={filters}
                setFilters={setFilters}
                jobs={jobs}
                variant="drawer"
                onClose={() => setMobileFiltersOpen(false)}
              />
            </div>
          </div>
        )}

        <main className="flex-1 min-w-0 px-4 sm:px-6 lg:px-7 py-5 lg:py-6 bg-white border border-[var(--border)] rounded-2xl">
          {/* Header de la grille */}
          <div className="flex items-center justify-between mb-5 lg:mb-6 gap-3">
            <div className="flex items-baseline gap-2.5 min-w-0">
              <h2 className="font-display text-[22px] sm:text-[24px] lg:text-[26px] tracking-[-0.015em] text-foreground truncate">
                {activeFilterCount === 0
                  ? "Toutes les offres"
                  : "Résultats"}
              </h2>
              <span className="wall-badge shrink-0" data-tone="muted">
                <span className="font-mono tabular-nums">
                  {filtered.length}
                </span>
              </span>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {/* Filter button mobile */}
              <button
                type="button"
                onClick={() => setMobileFiltersOpen(true)}
                className="lg:hidden h-8 px-3 rounded-full border border-[var(--border)] bg-white text-[12.5px] text-foreground/80 hover:text-foreground hover:border-foreground/30 transition-colors flex items-center gap-1.5"
              >
                <Filter width={12} height={12} strokeWidth={2} />
                Filtres
                {activeFilterCount > 0 && (
                  <span className="size-[18px] rounded-full bg-[var(--accent)] text-white text-[10px] font-mono font-medium flex items-center justify-center">
                    {activeFilterCount}
                  </span>
                )}
              </button>

              <div className="relative">
                <button
                  type="button"
                  onClick={() => setSortOpen((v) => !v)}
                  className="h-8 px-3 rounded-full border border-[var(--border)] bg-white text-[12.5px] text-foreground/80 hover:text-foreground hover:border-foreground/30 transition-colors flex items-center gap-1.5"
                >
                  <SortDown width={12} height={12} strokeWidth={2} />
                  <span className="hidden sm:inline">{sortLabel(sort)}</span>
                  <NavArrowDown width={11} height={11} strokeWidth={2.2} />
                </button>
                {sortOpen && (
                  <div
                    className="absolute right-0 top-9 z-20 bg-white border border-[var(--border)] rounded-xl shadow-[0_12px_32px_-8px_rgba(10,10,10,0.15)] py-1.5 min-w-[200px]"
                    onMouseLeave={() => setSortOpen(false)}
                  >
                    {(
                      [
                        ["recent", "Plus récentes"],
                        ...(isCandidate
                          ? ([["match", "Meilleur match"]] as const)
                          : []),
                        ["old", "Plus anciennes"],
                        ["company", "Entreprise A–Z"],
                        ["type", "Type de contrat"],
                      ] as Array<readonly [SortKey, string]>
                    ).map(([k, l]) => (
                      <button
                        key={k}
                        type="button"
                        onClick={() => {
                          setSort(k);
                          setSortOpen(false);
                        }}
                        className={`w-full text-left text-[13px] px-3 py-1.5 mx-1 rounded-lg hover:bg-[var(--background-alt)] ${
                          sort === k
                            ? "text-foreground font-medium"
                            : "text-foreground/70"
                        }`}
                        style={{ width: "calc(100% - 8px)" }}
                      >
                        {l}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="hidden sm:block">
                <DensityToggle density={density} setDensity={setDensity} />
              </div>
            </div>
          </div>

          {/* Featured hero */}
          <FeaturedJobs jobs={featuredJobs} density={density} />

          {/* Grille standard */}
          {standardJobs.length === 0 && featuredJobs.length === 0 ? (
            <EmptyState onReset={() => setFilters(emptyFilters())} />
          ) : (
            <div className="wall-grid" data-density={density}>
              {standardJobs.map((job, i) => (
                <JobCard
                  key={job.id}
                  job={job}
                  index={i}
                />
              ))}
            </div>
          )}
        </main>
      </div>

      <Footer />

      <CommandPalette
        jobs={jobs}
        open={paletteOpen}
        onClose={() => setPaletteOpen(false)}
      />
    </div>
  );
}

function sortLabel(s: SortKey): string {
  switch (s) {
    case "recent":
      return "Plus récentes";
    case "match":
      return "Meilleur match";
    case "old":
      return "Plus anciennes";
    case "company":
      return "Entreprise A–Z";
    case "type":
      return "Type de contrat";
  }
}

function DensityToggle({
  density,
  setDensity,
}: {
  density: Density;
  setDensity: (d: Density) => void;
}) {
  const items: Array<{
    key: Density;
    label: string;
    Icon: typeof ViewGrid;
  }> = [
    { key: "list", label: "Liste", Icon: List },
    { key: "comfortable", label: "2 colonnes", Icon: ViewColumns2 },
    { key: "standard", label: "3 colonnes", Icon: ViewColumns3 },
    { key: "dense", label: "4 colonnes", Icon: ViewGrid },
  ];
  return (
    <div className="flex items-center p-1 rounded-xl border border-[var(--border)] bg-white gap-0.5">
      {items.map(({ key, label, Icon }) => {
        const active = density === key;
        return (
          <button
            key={key}
            type="button"
            title={label}
            onClick={() => setDensity(key)}
            className={`h-7 px-2 rounded-lg flex items-center gap-1.5 transition-colors text-[11px] ${
              active
                ? "bg-foreground text-background"
                : "text-foreground/50 hover:text-foreground hover:bg-foreground/[0.04]"
            }`}
          >
            <Icon width={13} height={13} strokeWidth={2} />
            <span className="hidden xl:inline">{label}</span>
          </button>
        );
      })}
    </div>
  );
}

function EmptyState({ onReset }: { onReset: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-24">
      <p className="font-display italic text-[20px] text-foreground max-w-md">
        Aucune offre ne correspond à ces critères.
      </p>
      <div className="mt-6 flex items-center gap-6 text-[13px]">
        <button
          type="button"
          onClick={onReset}
          className="text-[var(--accent)] hover:underline underline-offset-4"
        >
          Élargir les filtres
        </button>
        <span className="text-[var(--tertiary-foreground)]">·</span>
        <button
          type="button"
          className="text-[var(--accent)] hover:underline underline-offset-4"
        >
          Créer une alerte pour cette recherche
        </button>
      </div>
    </div>
  );
}
