"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowUpRight,
  Bag,
  Eye,
  Group,
  PlusCircle,
  Rocket,
  Sparks,
} from "iconoir-react";
import { type EmployerJobStatus } from "@/lib/employer-store";
import { useUser } from "@/lib/auth";
import { useMyJobs } from "@/lib/supabase/use-my-jobs";
import { useMyCompany } from "@/lib/supabase/use-my-company";
import { JobStatusPill } from "./status-pill";
import { EmployerEmptyState } from "./employer-empty-state";

type Filter = "all" | EmployerJobStatus;
type SortKey = "recent" | "applications" | "views";

const FILTERS: Array<{ key: Filter; label: string }> = [
  { key: "all", label: "Toutes" },
  { key: "published", label: "Publiées" },
  { key: "paused", label: "En pause" },
  { key: "draft", label: "Brouillons" },
  { key: "closed", label: "Fermées" },
];

export function EmployerJobsList() {
  const user = useUser();
  const { jobs: supabaseJobs, loading } = useMyJobs();
  const { company } = useMyCompany();
  const quota = company?.job_quota ?? 1;
  const boostedCount = supabaseJobs.filter((j) => j.featured).length;
  const [filter, setFilter] = useState<Filter>("all");
  const [sort, setSort] = useState<SortKey>("recent");
  const [ownerScope, setOwnerScope] = useState<"all" | "mine">("all");

  const counts = useMemo(() => {
    const c: Record<Filter, number> = {
      all: supabaseJobs.length,
      published: 0,
      paused: 0,
      draft: 0,
      closed: 0,
    };
    for (const j of supabaseJobs) {
      const s = j.status as Filter;
      if (s in c) c[s]++;
    }
    return c;
  }, [supabaseJobs]);

  const filtered = useMemo(() => {
    let list = supabaseJobs;
    if (filter !== "all") list = list.filter((j) => j.status === filter);
    if (ownerScope === "mine" && user) {
      list = list.filter((j) => j.assigned_to === user.id);
    }
    list = [...list].sort((a, b) => {
      if (sort === "recent") return b.created_at.localeCompare(a.created_at);
      if (sort === "views") return (b.views ?? 0) - (a.views ?? 0);
      return b.applicationsCount - a.applicationsCount;
    });
    return list;
  }, [supabaseJobs, filter, sort, ownerScope, user]);

  return (
    <div className="max-w-[1100px] mx-auto">
      {/* Hero */}
      <header className="bg-white border border-[var(--border)] rounded-2xl px-5 sm:px-7 lg:px-9 py-6 lg:py-7 mb-3">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <p className="ed-label-sm">Toutes mes offres</p>
            <h1 className="font-display text-[24px] sm:text-[28px] lg:text-[30px] tracking-[-0.015em] text-foreground mt-1">
              Mes offres en ligne
            </h1>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 mt-3 text-[12.5px]">
              <span className="inline-flex items-center gap-1.5 text-foreground/65">
                <Bag width={12} height={12} strokeWidth={2} />
                {counts.all} / {quota} offre{quota > 1 ? "s" : ""}
              </span>
              <span className="inline-flex items-center gap-1.5 text-foreground/65">
                <Sparks width={12} height={12} strokeWidth={2} />
                {counts.published} publiee{counts.published > 1 ? "s" : ""}
              </span>
              <span className="inline-flex items-center gap-1.5 text-foreground/65">
                <Rocket width={12} height={12} strokeWidth={2} />
                {boostedCount} boostee{boostedCount > 1 ? "s" : ""}
              </span>
            </div>
            {/* Quota bar */}
            <div className="mt-3 max-w-[300px]">
              <div className="h-1.5 rounded-full bg-[var(--background-alt)] overflow-hidden">
                <div
                  className="h-full rounded-full bg-[var(--accent)] transition-[width] duration-500 ease-out"
                  style={{ width: `${Math.min(100, Math.round((counts.all / quota) * 100))}%` }}
                />
              </div>
              <p className="text-[10.5px] text-foreground/45 mt-1">
                {quota - counts.all > 0
                  ? `${quota - counts.all} offre${quota - counts.all > 1 ? "s" : ""} restante${quota - counts.all > 1 ? "s" : ""}`
                  : "Quota atteint"}
              </p>
            </div>
          </div>
          <Link
            href="/recruteur/publier"
            className="h-10 px-3 sm:px-4 rounded-full bg-foreground text-background text-[12.5px] sm:text-[13px] font-medium hover:bg-foreground/85 transition-colors flex items-center gap-2 shrink-0"
          >
            <PlusCircle width={14} height={14} strokeWidth={2} />
            Publier une offre
          </Link>
        </div>
      </header>

      {/* Toolbar */}
      <div className="flex items-center justify-between gap-3 mb-3 flex-wrap">
        <div className="flex flex-wrap items-center gap-1.5">
          {FILTERS.map((f) => {
            const active = filter === f.key;
            const count = counts[f.key];
            return (
              <button
                key={f.key}
                type="button"
                onClick={() => setFilter(f.key)}
                className={`h-8 px-3 rounded-full text-[12px] border transition-colors inline-flex items-center gap-1.5 ${
                  active
                    ? "bg-foreground text-background border-foreground"
                    : "bg-white text-foreground/75 border-[var(--border)] hover:border-foreground/30 hover:text-foreground"
                }`}
              >
                {f.label}
                <span
                  className={`text-[10.5px] font-mono tabular-nums ${
                    active ? "text-background/70" : "text-foreground/45"
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <div className="inline-flex rounded-full border border-[var(--border)] bg-white p-0.5">
            <button
              type="button"
              onClick={() => setOwnerScope("all")}
              className={`h-7 px-3 rounded-full text-[11.5px] font-medium transition-colors ${
                ownerScope === "all" ? "bg-foreground text-background" : "text-foreground/65 hover:text-foreground"
              }`}
            >
              Toutes
            </button>
            <button
              type="button"
              onClick={() => setOwnerScope("mine")}
              className={`h-7 px-3 rounded-full text-[11.5px] font-medium transition-colors ${
                ownerScope === "mine" ? "bg-foreground text-background" : "text-foreground/65 hover:text-foreground"
              }`}
            >
              Mes offres
            </button>
          </div>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as SortKey)}
            className="wall-select-pill"
            aria-label="Trier"
          >
            <option value="recent">Plus récentes</option>
            <option value="applications">Plus de candidatures</option>
            <option value="views">Plus de vues</option>
          </select>
        </div>
      </div>

      {/* List */}
      {loading ? (
        <div className="bg-white border border-[var(--border)] rounded-2xl p-12 flex items-center justify-center">
          <span className="size-6 border-2 border-foreground/20 border-t-foreground rounded-full animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <EmployerEmptyState
          icon={Bag}
          title={
            supabaseJobs.length === 0
              ? "Aucune offre publiee pour l'instant."
              : "Aucune offre ne correspond a ce filtre."
          }
          description="Publie ta premiere offre pour commencer a recevoir des candidatures."
          ctaLabel="Publier une offre"
          ctaHref="/recruteur/publier"
        />
      ) : (
        <div className="bg-white border border-[var(--border)] rounded-2xl divide-y divide-[var(--border)]">
          {filtered.map((job) => (
            <JobRow key={job.id} job={job} />
          ))}
        </div>
      )}
    </div>
  );
}

function JobRow({
  job,
}: {
  job: { id: string; slug: string; title: string; type: string; sector: string; location: string; status: string; views: number; applicationsCount: number };
}) {
  return (
    <Link
      href={`/recruteur/offres/${job.id}`}
      className="group block px-4 sm:px-6 lg:px-7 py-4 sm:py-5 hover:bg-[var(--background-alt)]/40 transition-colors"
    >
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto_auto_auto] items-start lg:items-center gap-3 lg:gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-display text-[16px] leading-tight tracking-[-0.005em] text-foreground line-clamp-1 group-hover:text-[var(--accent)] transition-colors">
              {job.title}
            </h3>
            <JobStatusPill status={job.status as EmployerJobStatus} />
          </div>
          <div className="text-[11.5px] text-muted-foreground mt-1 flex items-center gap-2 flex-wrap">
            <span>{job.type}</span>
            <span>·</span>
            <span>{job.sector}</span>
            <span>·</span>
            <span>{job.location}</span>
          </div>
        </div>

        <span className="wall-badge hidden md:inline-flex" data-tone="muted">
          <Eye /> {(job.views ?? 0).toLocaleString("fr-FR")}
        </span>

        <span className="wall-badge" data-tone={job.applicationsCount > 0 ? "accent" : "muted"}>
          <Group /> {job.applicationsCount}
        </span>

        <span className="size-7 rounded-full border border-[var(--border)] bg-white flex items-center justify-center text-foreground/60 group-hover:text-[var(--accent)] group-hover:border-[var(--accent)]/40 transition-colors shrink-0 justify-self-end">
          <ArrowUpRight width={12} height={12} strokeWidth={2.2} />
        </span>
      </div>
    </Link>
  );
}
