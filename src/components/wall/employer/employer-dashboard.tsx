"use client";

import { useMemo } from "react";
import Link from "next/link";
import {
  ArrowRight,
  ArrowUpRight,
  Bag,
  Calendar,
  Check,
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
  ONBOARDING_STEPS,
  onboardingProgress,
  useEmployer,
} from "@/lib/employer-store";
import { companies } from "@/lib/data";
import { CompanyLogo } from "../company-logo";
import { MiniStats } from "./mini-stats";
import { ApplicationStatusPill } from "./status-pill";

export function EmployerDashboard() {
  const user = useUser();
  const { jobs, applications, candidates, companyProfile, onboarding } = useEmployer();

  const company = useMemo(
    () => companies.find((c) => c.id === user?.companyId),
    [user?.companyId],
  );

  const breakdown = useMemo(() => {
    const out: Record<EmployerApplicationStatus, number> = {
      received: 0,
      reviewed: 0,
      interview: 0,
      offer: 0,
      hired: 0,
      rejected: 0,
    };
    for (const a of applications) out[a.status]++;
    return out;
  }, [applications]);

  const totalApps = applications.length;
  const totalViews = jobs.reduce((s, j) => s + j.views, 0);
  const interviewing = breakdown.interview + breakdown.offer;
  const publishedJobs = jobs.filter((j) => j.status === "published").length;

  // Top 5 candidats à traiter : received/reviewed avec match score le plus haut
  const toTreat = useMemo(
    () =>
      [...applications]
        .filter((a) => a.status === "received" || a.status === "reviewed")
        .sort((a, b) => b.matchScore - a.matchScore)
        .slice(0, 5),
    [applications],
  );

  // Activité récente : 8 derniers events
  const recentEvents = useMemo(() => {
    type Row = {
      appId: string;
      jobId: string;
      jobTitle: string;
      candidateName: string;
      candidateInitials: string;
      candidateColor: string;
      type: string;
      at: string;
      text?: string;
    };
    const out: Row[] = [];
    for (const app of applications) {
      const job = jobs.find((j) => j.id === app.jobId);
      const cand = candidates.find((c) => c.id === app.candidateId);
      if (!job || !cand) continue;
      for (const e of app.events) {
        out.push({
          appId: app.id,
          jobId: job.id,
          jobTitle: job.title,
          candidateName: cand.fullName,
          candidateInitials: cand.initials,
          candidateColor: cand.avatarColor,
          type: e.type,
          at: e.at,
          text: e.text,
        });
      }
    }
    return out.sort((a, b) => b.at.localeCompare(a.at)).slice(0, 8);
  }, [applications, jobs, candidates]);

  if (!user) return null;
  const displayName =
    companyProfile?.tagline ?? company?.tagline ?? "Console recruteur";

  return (
    <div className="max-w-[1100px] mx-auto">
      {/* Hero */}
      <header className="bg-white border border-[var(--border)] rounded-2xl px-5 sm:px-7 lg:px-9 py-6 lg:py-7 mb-3">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex items-start gap-4 min-w-0">
            {company && (
              <CompanyLogo
                name={company.name}
                domain={company.domain}
                color={company.logoColor}
                initials={company.initials}
                size={56}
                radius={16}
              />
            )}
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
      <OnboardingBanner onboarding={onboarding} />

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-3">
        <MiniStats
          icon={Bag}
          label="Offres publiées"
          value={publishedJobs}
          tone="accent"
        />
        <MiniStats
          icon={SendMail}
          label="Candidatures"
          value={totalApps}
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
            <PipelineBars breakdown={breakdown} total={totalApps} />
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
                {toTreat.map((app) => {
                  const cand = candidates.find((c) => c.id === app.candidateId);
                  const job = jobs.find((j) => j.id === app.jobId);
                  if (!cand || !job) return null;
                  return (
                    <li key={app.id}>
                      <Link
                        href={`/recruteur/candidats/${app.id}`}
                        className="grid grid-cols-[auto_1fr_auto_auto] items-center gap-3 py-2.5 -mx-2 px-2 rounded-lg hover:bg-[var(--background-alt)] transition-colors"
                      >
                        <span
                          className="size-9 rounded-xl flex items-center justify-center text-white font-display text-[12px] font-medium ring-1 ring-black/5"
                          style={{
                            background: `linear-gradient(155deg, ${cand.avatarColor}, #122a3f)`,
                          }}
                          aria-hidden
                        >
                          {cand.initials}
                        </span>
                        <div className="min-w-0">
                          <div className="text-[13.5px] font-medium text-foreground line-clamp-1">
                            {cand.fullName}
                          </div>
                          <div className="text-[11.5px] text-muted-foreground truncate">
                            {cand.headline} · {job.title}
                          </div>
                        </div>
                        <span className="wall-badge" data-tone="accent">
                          <Sparks /> {app.matchScore}%
                        </span>
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
                hint={`${jobs.length} au total`}
              />
              <ActionLink
                href="/recruteur/candidats"
                icon={Group}
                label="Tous les candidats"
                hint={`${totalApps} candidatures`}
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
            <p className="ed-label-sm mb-3">Activité récente</p>
            {recentEvents.length === 0 ? (
              <p className="text-[12.5px] text-muted-foreground">
                Aucune activité récente.
              </p>
            ) : (
              <ul className="flex flex-col gap-3">
                {recentEvents.map((evt, i) => (
                  <li key={`${evt.appId}-${i}`} className="text-[12px]">
                    <Link
                      href={`/recruteur/candidats/${evt.appId}`}
                      className="block hover:bg-[var(--background-alt)] -mx-1 px-1 py-1 rounded-md transition-colors"
                    >
                      <div className="flex items-baseline gap-1.5">
                        <span className="font-medium text-foreground line-clamp-1">
                          {evt.candidateName}
                        </span>
                        <span className="text-[10.5px] font-mono text-[var(--tertiary-foreground)] shrink-0">
                          {formatRelative(evt.at)}
                        </span>
                      </div>
                      <div className="text-foreground/65 line-clamp-1">
                        {evtSentence(evt.type)} · {evt.jobTitle}
                      </div>
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

function evtSentence(type: string): string {
  switch (type) {
    case "received":
      return "a candidaté";
    case "cv_viewed":
      return "CV consulté";
    case "status_changed":
      return "statut modifié";
    case "interview_scheduled":
      return "entretien planifié";
    case "offer_sent":
      return "offre envoyée";
    case "hired":
      return "embauché";
    case "rejected":
      return "candidature refusée";
    case "message_sent":
      return "message envoyé";
    case "note_added":
      return "note ajoutée";
    default:
      return type;
  }
}

function OnboardingBanner({
  onboarding,
}: {
  onboarding: ReturnType<typeof useEmployer>["onboarding"];
}) {
  const progress = onboardingProgress();
  if (progress.isComplete || onboarding.skippedAt) return null;

  return (
    <div className="bg-white border border-[var(--accent)]/20 rounded-2xl px-5 sm:px-7 lg:px-9 py-5 lg:py-6 mb-3">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="flex items-start gap-3 min-w-0">
          <span className="size-10 rounded-xl bg-[var(--accent)]/10 text-[var(--accent)] flex items-center justify-center shrink-0 mt-0.5">
            <Sparks width={18} height={18} strokeWidth={2} />
          </span>
          <div className="min-w-0">
            <h3 className="font-display text-[18px] tracking-[-0.01em] text-foreground">
              Configurez votre espace
            </h3>
            <p className="text-[13px] text-muted-foreground mt-0.5">
              {progress.done}/{progress.total} etapes completees — quelques minutes suffisent.
            </p>
          </div>
        </div>
        <Link
          href="/recruteur/onboarding"
          className="h-9 px-3.5 rounded-full bg-[var(--accent)] text-background text-[12.5px] font-medium hover:bg-[var(--accent)]/85 transition-colors flex items-center gap-1.5 shrink-0"
        >
          Continuer
          <ArrowRight width={12} height={12} strokeWidth={2} />
        </Link>
      </div>

      {/* Progress gauge */}
      <div className="mt-4 h-1.5 rounded-full bg-[var(--accent)]/10 overflow-hidden">
        <div
          className="h-full rounded-full bg-[var(--accent)] transition-[width] duration-500 ease-out"
          style={{ width: `${progress.percent}%` }}
        />
      </div>

      {/* Steps checklist */}
      <ul className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
        {ONBOARDING_STEPS.map((s) => {
          const done = onboarding.completed.includes(s.key);
          return (
            <li
              key={s.key}
              className={`flex items-center gap-2 text-[12.5px] ${
                done
                  ? "text-foreground/55 line-through"
                  : "text-foreground"
              }`}
            >
              <span
                className={`size-5 rounded-md flex items-center justify-center shrink-0 ${
                  done
                    ? "bg-[oklch(0.92_0.12_145_/_0.18)] text-[oklch(0.42_0.13_145)]"
                    : "bg-[var(--background-alt)] text-foreground/45"
                }`}
              >
                {done ? (
                  <Check width={11} height={11} strokeWidth={2.4} />
                ) : (
                  <span className="size-1.5 rounded-full bg-current" />
                )}
              </span>
              {s.label}
            </li>
          );
        })}
      </ul>
    </div>
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
