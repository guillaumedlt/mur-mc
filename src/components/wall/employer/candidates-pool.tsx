"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
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
import { useManualCandidates, updateManualCandidateSupabase } from "@/lib/supabase/use-manual-candidates";
import { ApplicationStatusPill } from "./status-pill";
import { StarRatingCompact } from "./star-rating";
import { EmployerEmptyState } from "./employer-empty-state";

type SortKey = "recent" | "match" | "rating";

// Unified type for display
type CandidateRow = {
  id: string;
  fullName: string;
  email: string;
  headline?: string;
  initials: string;
  avatarColor: string;
  status: EmployerApplicationStatus;
  matchScore: number;
  rating: number;
  appliedAt: string;
  jobId: string;
  source: string;
  tags: string[];
  notes?: string;
};

export function CandidatesPool() {
  const { jobs } = useMyJobs();
  const { applications, candidates } = useMyApplications(null);
  const { candidates: manualCands, refetch: refetchManual } = useManualCandidates();

  // Merge real applications + manual candidates into unified list
  const allRows: CandidateRow[] = useMemo(() => {
    const rows: CandidateRow[] = [];

    // Real applications
    for (const app of applications) {
      const cand = candidates.find((c) => c.id === app.candidateId);
      rows.push({
        id: app.id,
        fullName: cand?.fullName ?? "Candidat",
        email: cand?.email ?? "",
        headline: cand?.headline,
        initials: cand?.initials ?? "??",
        avatarColor: cand?.avatarColor ?? "#1C3D5A",
        status: app.status,
        matchScore: app.matchScore,
        rating: app.rating,
        appliedAt: app.appliedAt,
        jobId: app.jobId,
        source: "platform",
        tags: app.tags ?? [],
        notes: app.notes ?? undefined,
      });
    }

    // Manual candidates
    for (const mc of manualCands) {
      rows.push({
        id: `mc-${mc.id}`,
        fullName: mc.fullName,
        email: mc.email,
        headline: mc.headline,
        initials: mc.initials,
        avatarColor: mc.avatarColor,
        status: mc.status as EmployerApplicationStatus,
        matchScore: 0,
        rating: mc.rating,
        appliedAt: mc.createdAt,
        jobId: mc.jobId ?? "",
        source: mc.source,
        tags: mc.tags ?? [],
        notes: mc.notes,
      });
    }

    return rows;
  }, [applications, candidates, manualCands]);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] =
    useState<EmployerApplicationStatus | "all">("all");
  const [jobFilter, setJobFilter] = useState<string>("all");
  const [tagFilter, setTagFilter] = useState<string>("all");
  const [ratingFilter, setRatingFilter] = useState<number>(0); // 0 = all, 1-5 = min stars
  const [vivierOnly, setVivierOnly] = useState(false);
  const [sort, setSort] = useState<SortKey>("recent");

  // Quick tag add state
  const [quickTagTarget, setQuickTagTarget] = useState<string | null>(null);
  const [quickTagInput, setQuickTagInput] = useState("");

  const allStatuses: Array<EmployerApplicationStatus | "all"> = [
    "all",
    ...KANBAN_STATUSES,
  ];

  // Collect all unique tags across manual candidates
  const allTags = useMemo(() => {
    const tags = new Set<string>();
    for (const mc of manualCands) {
      for (const t of mc.tags ?? []) tags.add(t);
    }
    return Array.from(tags).sort();
  }, [manualCands]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    let list = allRows;
    if (statusFilter !== "all") {
      list = list.filter((a) => a.status === statusFilter);
    }
    if (jobFilter !== "all") {
      list = list.filter((a) => a.jobId === jobFilter);
    }
    if (tagFilter !== "all") {
      list = list.filter((a) => a.tags.includes(tagFilter));
    }
    if (ratingFilter > 0) {
      list = list.filter((a) => a.rating >= ratingFilter);
    }
    if (vivierOnly) {
      list = list.filter((a) => !a.jobId);
    }
    if (q) {
      list = list.filter((a) => {
        const hay = `${a.fullName} ${a.headline ?? ""} ${a.email} ${a.tags.join(" ")} ${a.notes ?? ""}`.toLowerCase();
        return hay.includes(q);
      });
    }
    list = [...list].sort((a, b) => {
      if (sort === "match") return b.matchScore - a.matchScore;
      if (sort === "rating") return b.rating - a.rating;
      return b.appliedAt.localeCompare(a.appliedAt);
    });
    return list;
  }, [allRows, query, statusFilter, jobFilter, tagFilter, ratingFilter, vivierOnly, sort]);

  const quickAddTag = async (candidateId: string, tag: string) => {
    const mc = manualCands.find((c) => `mc-${c.id}` === candidateId);
    if (!mc) return;
    const newTags = [...(mc.tags ?? []), tag];
    await updateManualCandidateSupabase(mc.id, { tags: newTags });
    setQuickTagTarget(null);
    setQuickTagInput("");
    refetchManual();
  };

  return (
    <div className="max-w-[1100px] mx-auto">
      <header className="bg-white border border-[var(--border)] rounded-2xl px-5 sm:px-7 lg:px-9 py-6 lg:py-7 mb-3">
        <p className="ed-label-sm">Vivier de talents</p>
        <h1 className="font-display text-[24px] sm:text-[28px] lg:text-[30px] tracking-[-0.015em] text-foreground mt-1">
          Tous les candidats
        </h1>
        <p className="text-[13.5px] text-muted-foreground mt-2">
          {allRows.length} candidat{allRows.length > 1 ? "s" : ""} ·{" "}
          {manualCands.filter((mc) => !mc.jobId).length} dans le vivier ·{" "}
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

      {/* Filters row */}
      <div className="bg-white border border-[var(--border)] rounded-2xl px-5 py-4 mb-3 flex flex-col gap-3">
        {/* Status chips */}
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-[10.5px] uppercase tracking-[0.08em] font-semibold text-foreground/40 mr-1">Statut</span>
          {allStatuses.map((s) => {
            const count = s === "all" ? allRows.length : allRows.filter((a) => a.status === s).length;
            const active = statusFilter === s;
            return (
              <button
                key={s}
                type="button"
                onClick={() => setStatusFilter(s)}
                className={`h-7 px-2.5 rounded-full text-[11.5px] border transition-colors inline-flex items-center gap-1 ${
                  active
                    ? "bg-foreground text-background border-foreground"
                    : "bg-white text-foreground/70 border-[var(--border)] hover:border-foreground/30"
                }`}
              >
                {s === "all" ? "Tous" : statusLabel(s)}
                <span className={`text-[10px] font-mono tabular-nums ${active ? "text-background/60" : "text-foreground/40"}`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Tag chips */}
        {allTags.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[10.5px] uppercase tracking-[0.08em] font-semibold text-foreground/40 mr-1">Tags</span>
            <button
              type="button"
              onClick={() => setTagFilter("all")}
              className={`h-7 px-2.5 rounded-full text-[11.5px] border transition-colors ${
                tagFilter === "all"
                  ? "bg-foreground text-background border-foreground"
                  : "bg-white text-foreground/70 border-[var(--border)] hover:border-foreground/30"
              }`}
            >
              Tous
            </button>
            {allTags.map((tag) => {
              const active = tagFilter === tag;
              const count = allRows.filter((r) => r.tags.includes(tag)).length;
              return (
                <button
                  key={tag}
                  type="button"
                  onClick={() => setTagFilter(active ? "all" : tag)}
                  className={`h-7 px-2.5 rounded-full text-[11.5px] border transition-colors inline-flex items-center gap-1 ${
                    active
                      ? "bg-[var(--accent)] text-background border-[var(--accent)]"
                      : "bg-[var(--accent)]/5 text-[var(--accent)] border-[var(--accent)]/20 hover:border-[var(--accent)]/40"
                  }`}
                >
                  {tag}
                  <span className={`text-[10px] font-mono ${active ? "text-background/60" : "text-[var(--accent)]/60"}`}>{count}</span>
                </button>
              );
            })}
          </div>
        )}

        {/* Rating filter */}
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-[10.5px] uppercase tracking-[0.08em] font-semibold text-foreground/40 mr-1">Note</span>
          {[0, 1, 2, 3, 4, 5].map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => setRatingFilter(r)}
              className={`h-7 px-2.5 rounded-full text-[11.5px] border transition-colors ${
                ratingFilter === r
                  ? "bg-foreground text-background border-foreground"
                  : "bg-white text-foreground/70 border-[var(--border)] hover:border-foreground/30"
              }`}
            >
              {r === 0 ? "Toutes" : `${r}+ ★`}
            </button>
          ))}
        </div>

        {/* Vivier toggle */}
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 text-[12px] text-foreground/70 cursor-pointer select-none">
            <span className="wall-check" data-checked={vivierOnly} />
            <input type="checkbox" checked={vivierOnly} onChange={(e) => setVivierOnly(e.target.checked)} className="sr-only" />
            Vivier uniquement (sans offre)
          </label>
        </div>
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
            setTagFilter("all");
            setRatingFilter(0);
            setVivierOnly(false);
          }}
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {filtered.map((row) => {
            const job = jobs.find((j) => j.id === row.jobId);
            const href = `/recruteur/candidats/${row.id}`;
            const hasTopTag = row.tags.some((t) => t === "Top profil" || t === "Urgent");
            return (
              <Link
                key={row.id}
                href={href}
                className={`group bg-white border rounded-2xl p-4 sm:p-5 hover:shadow-[0_4px_24px_rgba(10,10,10,0.06)] transition-all flex flex-col ${
                  hasTopTag
                    ? "border-[var(--accent)]/30 ring-1 ring-[var(--accent)]/10"
                    : "border-[var(--border)] hover:border-foreground/20"
                }`}
              >
                {/* Header: avatar + name + status */}
                <div className="flex items-start gap-3">
                  <span
                    className="size-11 rounded-xl flex items-center justify-center text-white font-display text-[13px] font-medium ring-1 ring-black/5 shrink-0"
                    style={{ background: `linear-gradient(155deg, ${row.avatarColor}, #122a3f)` }}
                    aria-hidden
                  >
                    {row.initials}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="text-[14px] font-medium text-foreground line-clamp-1 group-hover:text-[var(--accent)] transition-colors">
                      {row.fullName}
                    </div>
                    {row.headline && (
                      <div className="text-[12px] text-muted-foreground line-clamp-1 mt-0.5">
                        {row.headline}
                      </div>
                    )}
                  </div>
                  <ApplicationStatusPill status={row.status} />
                </div>

                {/* Tags + quick add */}
                <div className="flex flex-wrap items-center gap-1 mt-3">
                  {row.tags.map((tag) => (
                    <span
                      key={tag}
                      className={`h-5 px-1.5 rounded-full text-[10px] inline-flex items-center ${
                        tag === "Top profil" || tag === "Urgent"
                          ? "bg-[var(--accent)]/15 text-[var(--accent)] font-medium"
                          : "bg-[var(--background-alt)] text-foreground/60 border border-[var(--border)]"
                      }`}
                    >
                      {tag}
                    </span>
                  ))}
                  {row.id.startsWith("mc-") && (
                    <>
                      {quickTagTarget === row.id ? (
                        <div className="flex items-center gap-1" onClick={(e) => e.preventDefault()}>
                          <input
                            type="text"
                            value={quickTagInput}
                            onChange={(e) => setQuickTagInput(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") { e.preventDefault(); quickAddTag(row.id, quickTagInput); }
                              if (e.key === "Escape") { setQuickTagTarget(null); setQuickTagInput(""); }
                            }}
                            placeholder="Tag..."
                            autoFocus
                            className="h-5 w-20 px-1.5 rounded-full bg-white border border-[var(--accent)]/30 text-[10px] outline-none focus:border-[var(--accent)]"
                          />
                          {["Top profil", "A recontacter", "Senior"].filter((t) => !row.tags.includes(t)).slice(0, 2).map((t) => (
                            <button key={t} type="button" onClick={(e) => { e.preventDefault(); quickAddTag(row.id, t); }} className="h-5 px-1.5 rounded-full bg-[var(--accent)]/10 text-[var(--accent)] text-[9px] hover:bg-[var(--accent)]/20 transition-colors">
                              {t}
                            </button>
                          ))}
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={(e) => { e.preventDefault(); setQuickTagTarget(row.id); }}
                          className="size-5 rounded-full border border-dashed border-[var(--border)] text-foreground/30 hover:text-[var(--accent)] hover:border-[var(--accent)]/30 transition-colors flex items-center justify-center"
                        >
                          <PlusCircle width={10} height={10} strokeWidth={2} />
                        </button>
                      )}
                    </>
                  )}
                </div>

                {/* Meta row */}
                <div className="flex items-center gap-2 mt-3 pt-3 border-t border-[var(--border)] text-[11px] text-foreground/50">
                  {job && (
                    <span className="truncate max-w-[140px]">
                      <Sparks width={10} height={10} strokeWidth={2} className="inline -mt-px mr-0.5" />
                      {job.title}
                    </span>
                  )}
                  {!job && row.jobId === "" && (
                    <span className="text-[var(--accent)]/70">Vivier</span>
                  )}
                  <span className="ml-auto font-mono shrink-0">
                    {formatShort(row.appliedAt)}
                  </span>
                  {row.rating > 0 && <StarRatingCompact value={row.rating} />}
                </div>
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
