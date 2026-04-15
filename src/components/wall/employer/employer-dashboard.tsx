"use client";

import { useMemo } from "react";
import Link from "next/link";
import {
  ArrowUpRight,
  Bag,
  Calendar,
  Eye,
  Group,
  MultiplePages,
  PlusCircle,
  SendMail,
  Sparks,
} from "iconoir-react";
import { useUser } from "@/lib/auth";
import {
  type EmployerApplicationStatus,
  KANBAN_STATUSES,
  useEmployer,
} from "@/lib/employer-store";
import { useMyJobs } from "@/lib/supabase/use-my-jobs";
import { useMyApplications } from "@/lib/supabase/use-my-applications";
import { useManualCandidates } from "@/lib/supabase/use-manual-candidates";
import { useMyCompany } from "@/lib/supabase/use-my-company";
import { MiniStats } from "./mini-stats";
import { ApplicationStatusPill } from "./status-pill";

type CandidateRow = {
  id: string;
  fullName: string;
  headline?: string;
  initials: string;
  avatarColor: string;
  status: EmployerApplicationStatus;
  matchScore: number;
  appliedAt: string;
  jobId: string;
  linkId: string; // for href
};

export function EmployerDashboard() {
  const user = useUser();
  useEmployer(); // ownership check
  const { jobs: supabaseJobs, loading: jobsLoading } = useMyJobs();
  const { applications, candidates } = useMyApplications(null);
  const { candidates: manualCands } = useManualCandidates();
  const { company } = useMyCompany();

  const publishedCount = supabaseJobs.filter((j) => j.status === "published").length;

  // Merge all candidates into unified rows
  const allRows = useMemo(() => {
    const rows: CandidateRow[] = [];
    for (const app of applications) {
      const cand = candidates.find((c) => c.id === app.candidateId);
      rows.push({
        id: app.id,
        fullName: cand?.fullName ?? "Candidat",
        headline: cand?.headline,
        initials: cand?.initials ?? "??",
        avatarColor: cand?.avatarColor ?? "#1C3D5A",
        status: app.status,
        matchScore: app.matchScore,
        appliedAt: app.appliedAt,
        jobId: app.jobId,
        linkId: app.id,
      });
    }
    for (const mc of manualCands) {
      rows.push({
        id: `mc-${mc.id}`,
        fullName: mc.fullName,
        headline: mc.headline,
        initials: mc.initials,
        avatarColor: mc.avatarColor,
        status: mc.status as EmployerApplicationStatus,
        matchScore: 0,
        appliedAt: mc.createdAt,
        jobId: mc.jobId ?? "",
        linkId: `mc-${mc.id}`,
      });
    }
    return rows;
  }, [applications, candidates, manualCands]);

  const breakdown = useMemo(() => {
    const out: Record<EmployerApplicationStatus, number> = {
      received: 0, shortlisted: 0, reviewed: 0, interview: 0, offer: 0, hired: 0, rejected: 0,
    };
    for (const r of allRows) out[r.status]++;
    return out;
  }, [allRows]);

  const totalCandidates = allRows.length;
  const totalViews = supabaseJobs.reduce((s, j) => s + (j.views ?? 0), 0);
  const interviewing = breakdown.interview + breakdown.offer;

  // Top 5 candidats a traiter : received/reviewed, les plus recents
  const toTreat = useMemo(
    () =>
      [...allRows]
        .filter((r) => r.status === "received" || r.status === "reviewed")
        .sort((a, b) => b.appliedAt.localeCompare(a.appliedAt))
        .slice(0, 5),
    [allRows],
  );

  if (!user) return null;
  const displayName =
    company?.tagline ?? user.companyName ?? "Console recruteur";

  return (
    <div className="max-w-[1100px] mx-auto">
      {/* Hero */}
      <header className="bg-white border border-[var(--border)] rounded-2xl px-5 sm:px-7 lg:px-9 py-6 lg:py-7 mb-3">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex items-start gap-4 min-w-0">
            <span
              className="size-14 rounded-2xl flex items-center justify-center text-white font-display text-[18px] font-medium ring-1 ring-black/5 shadow-[0_2px_10px_-2px_rgba(10,10,10,0.18)] shrink-0"
              style={{
                background: `linear-gradient(155deg, ${user.avatarColor}, #122a3f)`,
              }}
            >
              {user.initials}
            </span>
            <div className="min-w-0">
              <p className="ed-label-sm">Mon espace recruteur</p>
              <h1 className="font-display text-[22px] sm:text-[26px] lg:text-[28px] tracking-[-0.015em] text-foreground mt-1">
                Bonjour, {user.name.split(" ")[0]}.
              </h1>
              <p className="text-[13px] text-muted-foreground mt-1 line-clamp-1">
                {displayName}
              </p>
            </div>
          </div>
          <Link
            href="/recruteur/publier"
            className="h-10 px-3 sm:px-4 rounded-full bg-foreground text-background text-[12.5px] sm:text-[13px] font-medium hover:bg-foreground/85 transition-colors flex items-center gap-2 shrink-0"
          >
            <PlusCircle width={14} height={14} strokeWidth={2} />
            <span className="hidden sm:inline">Publier une offre</span>
            <span className="sm:hidden">Publier</span>
          </Link>
        </div>
      </header>

      {/* Onboarding banner */}

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-3">
        <MiniStats
          icon={Bag}
          label="Offres publiees"
          value={jobsLoading ? "..." : publishedCount}
          tone="accent"
        />
        <MiniStats
          icon={SendMail}
          label="Candidats"
          value={totalCandidates}
          tone="muted"
        />
        <MiniStats
          icon={Calendar}
          label="En entretien"
          value={interviewing}
          tone="fresh"
        />
        <MiniStats
          icon={Eye}
          label="Vues totales"
          value={totalViews.toLocaleString("fr-FR")}
          tone="muted"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 items-start">
        {/* Colonne gauche : breakdown + activité + à traiter */}
        <div className="lg:col-span-2 flex flex-col gap-3">
          {/* Pipeline breakdown */}
          <article className="bg-white border border-[var(--border)] rounded-2xl px-5 sm:px-7 lg:px-9 py-6 lg:py-7">
            <div className="flex items-baseline justify-between mb-5">
              <h2 className="font-display text-[20px] tracking-[-0.01em]">
                Pipeline de recrutement
              </h2>
              <Link
                href="/recruteur/candidats"
                className="text-[12.5px] text-[var(--accent)] hover:underline underline-offset-2"
              >
                Voir tous →
              </Link>
            </div>
            <PipelineBars breakdown={breakdown} total={totalCandidates} />
          </article>

          {/* Top à traiter */}
          <article className="bg-white border border-[var(--border)] rounded-2xl px-5 sm:px-7 lg:px-9 py-6 lg:py-7">
            <div className="flex items-baseline justify-between mb-5">
              <div className="flex items-baseline gap-2.5">
                <h2 className="font-display text-[20px] tracking-[-0.01em]">
                  À traiter en priorité
                </h2>
                <span className="wall-badge" data-tone="accent">
                  <Sparks /> {toTreat.length}
                </span>
              </div>
              <Link
                href="/recruteur/candidats"
                className="text-[12.5px] text-[var(--accent)] hover:underline underline-offset-2"
              >
                Pool complet →
              </Link>
            </div>
            {toTreat.length === 0 ? (
              <p className="text-[13px] text-muted-foreground italic font-display">
                Tu es à jour, tous les candidats récents ont été consultés.
              </p>
            ) : (
              <ul className="flex flex-col">
                {toTreat.map((row) => {
                  const sbJob = supabaseJobs.find((j: { id: string }) => j.id === row.jobId);
                  return (
                    <li key={row.id}>
                      <Link
                        href={`/recruteur/candidats/${row.linkId}`}
                        className="grid grid-cols-[auto_1fr_auto_auto] items-center gap-3 py-2.5 -mx-2 px-2 rounded-lg hover:bg-[var(--background-alt)] transition-colors"
                      >
                        <span
                          className="size-9 rounded-xl flex items-center justify-center text-white font-display text-[12px] font-medium ring-1 ring-black/5"
                          style={{
                            background: `linear-gradient(155deg, ${row.avatarColor}, #122a3f)`,
                          }}
                          aria-hidden
                        >
                          {row.initials}
                        </span>
                        <div className="min-w-0">
                          <div className="text-[13.5px] font-medium text-foreground line-clamp-1">
                            {row.fullName}
                          </div>
                          <div className="text-[11.5px] text-muted-foreground truncate">
                            {row.headline ?? ""}{sbJob ? ` · ${sbJob.title}` : ""}
                          </div>
                        </div>
                        <ApplicationStatusPill status={row.status} />
                        <ArrowUpRight
                          width={12}
                          height={12}
                          strokeWidth={2.2}
                          className="text-foreground/40"
                        />
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
          </article>
        </div>

        {/* Sidebar : raccourcis + activité */}
        <aside className="lg:sticky lg:top-[140px] flex flex-col gap-3">
          <div className="bg-white border border-[var(--border)] rounded-2xl p-5">
            <p className="ed-label-sm mb-3">Raccourcis</p>
            <div className="flex flex-col">
              <ActionLink
                href="/recruteur/offres"
                icon={Bag}
                label="Mes offres"
                hint={`${supabaseJobs.length} au total`}
              />
              <ActionLink
                href="/recruteur/candidats"
                icon={Group}
                label="Tous les candidats"
                hint={`${totalCandidates} candidats`}
              />
              <ActionLink
                href="/recruteur/entreprise"
                icon={MultiplePages}
                label="Ma fiche entreprise"
                hint="Éditer la page publique"
              />
            </div>
          </div>

          <div className="bg-white border border-[var(--border)] rounded-2xl p-5">
            <p className="ed-label-sm mb-3">Derniers candidats</p>
            {allRows.length === 0 ? (
              <p className="text-[12.5px] text-muted-foreground">
                Aucun candidat pour l&apos;instant.
              </p>
            ) : (
              <ul className="flex flex-col gap-2">
                {[...allRows]
                  .sort((a, b) => b.appliedAt.localeCompare(a.appliedAt))
                  .slice(0, 6)
                  .map((row) => (
                    <li key={row.id}>
                      <Link
                        href={`/recruteur/candidats/${row.linkId}`}
                        className="flex items-center gap-2.5 hover:bg-[var(--background-alt)] -mx-1 px-1 py-1.5 rounded-md transition-colors"
                      >
                        <span
                          className="size-7 rounded-lg flex items-center justify-center text-white font-display text-[10px] font-medium ring-1 ring-black/5 shrink-0"
                          style={{
                            background: `linear-gradient(155deg, ${row.avatarColor}, #122a3f)`,
                          }}
                        >
                          {row.initials}
                        </span>
                        <div className="min-w-0 flex-1">
                          <div className="text-[12.5px] font-medium text-foreground line-clamp-1">
                            {row.fullName}
                          </div>
                        </div>
                        <span className="text-[10px] font-mono text-[var(--tertiary-foreground)] shrink-0">
                          {formatRelative(row.appliedAt)}
                        </span>
                      </Link>
                    </li>
                  ))}
              </ul>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}

/* ─── Pipeline bars ─── */

function PipelineBars({
  breakdown,
  total,
}: {
  breakdown: Record<EmployerApplicationStatus, number>;
  total: number;
}) {
  if (total === 0) {
    return (
      <p className="text-[13px] text-muted-foreground italic font-display">
        Aucune candidature pour l&apos;instant.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-3.5">
      {KANBAN_STATUSES.map((s) => {
        const count = breakdown[s];
        const pct = total > 0 ? Math.round((count / total) * 100) : 0;
        return (
          <div key={s} className="flex items-center gap-3">
            <ApplicationStatusPill status={s} />
            <div className="flex-1 h-2 rounded-full bg-[var(--background-alt)] overflow-hidden">
              <div
                className="h-full rounded-full bg-foreground/85 transition-[width] duration-500 ease-out"
                style={{ width: `${pct}%` }}
              />
            </div>
            <span className="text-[12px] font-mono text-foreground/70 tabular-nums w-10 text-right">
              {count}
            </span>
          </div>
        );
      })}
    </div>
  );
}

/* ─── ActionLink ─── */

function ActionLink({
  href,
  icon: Icon,
  label,
  hint,
}: {
  href: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  label: string;
  hint: string;
}) {
  return (
    <Link
      href={href}
      className="flex items-center gap-3 p-2 -mx-1 rounded-lg hover:bg-[var(--background-alt)] transition-colors"
    >
      <span className="size-8 rounded-lg bg-[var(--background-alt)] text-foreground/60 flex items-center justify-center">
        <Icon width={13} height={13} strokeWidth={2} />
      </span>
      <div className="min-w-0 flex-1">
        <div className="text-[13px] font-medium text-foreground">{label}</div>
        <div className="text-[11.5px] text-muted-foreground">{hint}</div>
      </div>
      <ArrowUpRight
        width={11}
        height={11}
        strokeWidth={2.2}
        className="text-foreground/35"
      />
    </Link>
  );
}



function formatRelative(iso: string): string {
  const d = new Date(iso);
  const diffDays = Math.round(
    (Date.now() - d.getTime()) / (1000 * 60 * 60 * 24),
  );
  if (diffDays <= 0) return "auj.";
  if (diffDays === 1) return "hier";
  if (diffDays < 7) return `${diffDays}j`;
  return `${Math.round(diffDays / 7)}sem`;
}
