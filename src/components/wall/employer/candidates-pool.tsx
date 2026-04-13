"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowUpRight,
  Calendar,
  Group,
  PlusCircle,
  Search,
  Sparks,
  Upload,
  Xmark,
} from "iconoir-react";
import {
  type EmployerApplicationStatus,
  KANBAN_STATUSES,
  candidateSourceLabel,
  statusLabel,
} from "@/lib/employer-store";
import { useMyJobs } from "@/lib/supabase/use-my-jobs";
import { useMyApplications } from "@/lib/supabase/use-my-applications";
import { ApplicationStatusPill } from "./status-pill";
import { StarRatingCompact } from "./star-rating";
import { EmployerEmptyState } from "./employer-empty-state";

type SortKey = "recent" | "match" | "rating";

export function CandidatesPool() {
  const { jobs } = useMyJobs();
  // Load applications for all jobs — pass null to get all for this employer
  const { applications, candidates } = useMyApplications(null);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] =
    useState<EmployerApplicationStatus | "all">("all");
  const [jobFilter, setJobFilter] = useState<string>("all");
  const [sort, setSort] = useState<SortKey>("recent");

  const allStatuses: Array<EmployerApplicationStatus | "all"> = [
    "all",
    ...KANBAN_STATUSES,
    "rejected",
  ];

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    let list = applications;
    if (statusFilter !== "all") {
      list = list.filter((a) => a.status === statusFilter);
    }
    if (jobFilter !== "all") {
      list = list.filter((a) => a.jobId === jobFilter);
    }
    if (q) {
      list = list.filter((a) => {
        const cand = candidates.find((c) => c.id === a.candidateId);
        if (!cand) return false;
        const hay =
          `${cand.fullName} ${cand.headline} ${cand.skills.join(" ")} ${cand.email}`.toLowerCase();
        return hay.includes(q);
      });
    }
    list = [...list].sort((a, b) => {
      if (sort === "match") return b.matchScore - a.matchScore;
      if (sort === "rating") return b.rating - a.rating;
      return b.appliedAt.localeCompare(a.appliedAt);
    });
    return list;
  }, [applications, candidates, query, statusFilter, jobFilter, sort]);

  return (
    <div className="max-w-[1100px] mx-auto">
      <header className="bg-white border border-[var(--border)] rounded-2xl px-5 sm:px-7 lg:px-9 py-6 lg:py-7 mb-3">
        <p className="ed-label-sm">Tous les candidats</p>
        <h1 className="font-display text-[24px] sm:text-[28px] lg:text-[30px] tracking-[-0.015em] text-foreground mt-1">
          Pool de candidatures
        </h1>
        <p className="text-[13.5px] text-muted-foreground mt-2">
          {applications.length} candidature{applications.length > 1 ? "s" : ""} sur{" "}
          {jobs.length} offre{jobs.length > 1 ? "s" : ""}
        </p>
        <div className="flex items-center gap-2 mt-4">
          <Link
            href="/recruteur/candidats/ajouter"
            className="h-9 px-3.5 rounded-full bg-foreground text-background text-[12.5px] font-medium hover:bg-foreground/85 transition-colors flex items-center gap-1.5"
          >
            <PlusCircle width={13} height={13} strokeWidth={2} />
            Ajouter un candidat
          </Link>
          <Link
            href="/recruteur/candidats/ajouter"
            className="h-9 px-3.5 rounded-full border border-[var(--border)] bg-white text-[12.5px] text-foreground/80 hover:text-foreground hover:bg-[var(--background-alt)] transition-colors flex items-center gap-1.5"
          >
            <Upload width={13} height={13} strokeWidth={2} />
            Import CSV
          </Link>
        </div>
      </header>

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2 mb-3">
        {/* Search */}
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
            placeholder="Nom, compétence, email…"
            className="flex-1 min-w-0 bg-transparent outline-none text-[13px] placeholder:text-[var(--tertiary-foreground)]"
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

        {/* Job select */}
        <select
          value={jobFilter}
          onChange={(e) => setJobFilter(e.target.value)}
          className="wall-select-pill max-w-[220px] truncate"
          aria-label="Offre"
        >
          <option value="all">Toutes les offres</option>
          {jobs.map((j) => (
            <option key={j.id} value={j.id}>
              {j.title}
            </option>
          ))}
        </select>

        {/* Sort */}
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value as SortKey)}
          className="wall-select-pill ml-auto"
          aria-label="Trier"
        >
          <option value="recent">Plus récent</option>
          <option value="match">Meilleur match</option>
          <option value="rating">Meilleure note</option>
        </select>
      </div>

      {/* Status chips */}
      <div className="flex flex-wrap items-center gap-1.5 mb-3">
        {allStatuses.map((s) => {
          const count =
            s === "all"
              ? applications.length
              : applications.filter((a) => a.status === s).length;
          const active = statusFilter === s;
          return (
            <button
              key={s}
              type="button"
              onClick={() => setStatusFilter(s)}
              className={`h-8 px-3 rounded-full text-[12px] border transition-colors inline-flex items-center gap-1.5 ${
                active
                  ? "bg-foreground text-background border-foreground"
                  : "bg-white text-foreground/75 border-[var(--border)] hover:border-foreground/30"
              }`}
            >
              {s === "all" ? "Tous" : statusLabel(s)}
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

      {/* List */}
      {filtered.length === 0 ? (
        <EmployerEmptyState
          icon={Group}
          title="Aucun candidat ne correspond."
          ctaLabel="Tout afficher"
          onCta={() => {
            setQuery("");
            setStatusFilter("all");
            setJobFilter("all");
          }}
        />
      ) : (
        <div className="bg-white border border-[var(--border)] rounded-2xl divide-y divide-[var(--border)]">
          {filtered.map((app) => {
            const cand = candidates.find((c) => c.id === app.candidateId);
            const job = jobs.find((j) => j.id === app.jobId);
            if (!cand || !job) return null;
            return (
              <Link
                key={app.id}
                href={`/recruteur/candidats/${app.id}`}
                className="group flex items-center gap-3 sm:gap-4 px-4 sm:px-6 lg:px-7 py-3 sm:py-4 hover:bg-[var(--background-alt)]/40 transition-colors"
              >
                <span
                  className="size-10 rounded-xl flex items-center justify-center text-white font-display text-[12px] font-medium ring-1 ring-black/5 shrink-0"
                  style={{
                    background: `linear-gradient(155deg, ${cand.avatarColor}, #122a3f)`,
                  }}
                  aria-hidden
                >
                  {cand.initials}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="text-[14px] font-medium text-foreground line-clamp-1 group-hover:text-[var(--accent)] transition-colors">
                    {cand.fullName}
                  </div>
                  <div className="text-[11.5px] text-muted-foreground line-clamp-1 mt-0.5">
                    {cand.headline} · {job.title}
                  </div>
                </div>
                <div className="hidden sm:flex items-center gap-2 shrink-0">
                  {app.matchScore >= 65 && (
                    <span className="wall-badge" data-tone="accent">
                      <Sparks /> {app.matchScore}%
                    </span>
                  )}
                  {app.rating > 0 && <StarRatingCompact value={app.rating} />}
                </div>
                <ApplicationStatusPill status={app.status} />
                {cand.source !== "platform" && (
                  <span className="wall-badge hidden lg:inline-flex" data-tone="muted">
                    {candidateSourceLabel(cand.source)}
                  </span>
                )}
                <span className="text-[10.5px] font-mono text-[var(--tertiary-foreground)] hidden md:inline-flex items-center gap-1 shrink-0">
                  <Calendar width={10} height={10} strokeWidth={2} />
                  {formatShort(app.appliedAt)}
                </span>
                <ArrowUpRight
                  width={12}
                  height={12}
                  strokeWidth={2.2}
                  className="text-foreground/40 group-hover:text-[var(--accent)] shrink-0"
                />
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

function formatShort(iso: string): string {
  const d = new Date(iso);
  const diff = Math.round(
    (Date.now() - d.getTime()) / (1000 * 60 * 60 * 24),
  );
  if (diff <= 0) return "auj.";
  if (diff === 1) return "hier";
  if (diff < 7) return `${diff}j`;
  return `${Math.round(diff / 7)}sem`;
}
