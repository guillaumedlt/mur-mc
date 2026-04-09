"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowUpRight,
  Bag,
  Eye,
  Group,
  PlusCircle,
} from "iconoir-react";
import {
  type EmployerJob,
  type EmployerJobStatus,
  applicationsForJob,
  useEmployer,
} from "@/lib/employer-store";
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
  const { jobs, applications } = useEmployer();
  const [filter, setFilter] = useState<Filter>("all");
  const [sort, setSort] = useState<SortKey>("recent");

  const counts = useMemo(() => {
    const c: Record<Filter, number> = {
      all: jobs.length,
      published: 0,
      paused: 0,
      draft: 0,
      closed: 0,
    };
    for (const j of jobs) c[j.status]++;
    return c;
  }, [jobs]);

  const filtered = useMemo(() => {
    let list = jobs;
    if (filter !== "all") list = list.filter((j) => j.status === filter);
    list = [...list].sort((a, b) => {
      if (sort === "recent") return b.createdAt.localeCompare(a.createdAt);
      if (sort === "views") return b.views - a.views;
      // applications count
      const aCount = applications.filter((x) => x.jobId === a.id).length;
      const bCount = applications.filter((x) => x.jobId === b.id).length;
      return bCount - aCount;
    });
    return list;
  }, [jobs, applications, filter, sort]);

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
            <p className="text-[13.5px] text-muted-foreground mt-2">
              {counts.all} offre{counts.all > 1 ? "s" : ""} au total · {counts.published} publiée{counts.published > 1 ? "s" : ""}
            </p>
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

      {/* List */}
      {filtered.length === 0 ? (
        <EmployerEmptyState
          icon={Bag}
          title={
            jobs.length === 0
              ? "Aucune offre publiée pour l'instant."
              : "Aucune offre ne correspond à ce filtre."
          }
          description="Publie ta première offre pour commencer à recevoir des candidatures."
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

function JobRow({ job }: { job: EmployerJob }) {
  const apps = applicationsForJob(job.id);
  const inProgress = apps.filter((a) =>
    ["received", "reviewed", "interview", "offer"].includes(a.status),
  ).length;

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
            <JobStatusPill status={job.status} />
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
          <Eye /> {job.views.toLocaleString("fr-FR")}
        </span>

        <span className="wall-badge" data-tone={inProgress > 0 ? "accent" : "muted"}>
          <Group /> {apps.length}
        </span>

        <span className="size-7 rounded-full border border-[var(--border)] bg-white flex items-center justify-center text-foreground/60 group-hover:text-[var(--accent)] group-hover:border-[var(--accent)]/40 transition-colors shrink-0 justify-self-end">
          <ArrowUpRight width={12} height={12} strokeWidth={2.2} />
        </span>
      </div>
    </Link>
  );
}
