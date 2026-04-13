"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowUpRight,
  Bag,
  BellNotification,
  Bookmark,
  Calendar,
  Download,
  PageStar,
  SendMail,
  Sparks,
  UserCircle,
} from "iconoir-react";
import type { Job } from "@/lib/data";
import { useAuthLoading, useUser } from "@/lib/auth";
import {
  type ApplicationStatus,
  matchScore,
  profileCompletion,
  statusLabel,
  statusTone,
  useCandidate,
} from "@/lib/candidate-store";
import { useSavedJobs } from "@/lib/supabase/use-saved-jobs";
import { useCandidateApplications } from "@/lib/supabase/use-candidate-applications";
import { CompanyLogo } from "./company-logo";
import { UserAvatar } from "./user-avatar";

type Props = { jobs: Job[] };

export function CandidateDashboard({ jobs }: Props) {
  const user = useUser();
  const loading = useAuthLoading();
  const router = useRouter();
  const { profile } = useCandidate();
  const { savedIds } = useSavedJobs();
  const { applications: sbApplications } = useCandidateApplications();

  useEffect(() => {
    if (!loading && user === null) {
      const t = window.setTimeout(() => router.replace("/connexion"), 100);
      return () => window.clearTimeout(t);
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="max-w-[1100px] mx-auto bg-white border border-[var(--border)] rounded-2xl p-12 flex items-center justify-center">
        <span className="size-6 border-2 border-foreground/20 border-t-foreground rounded-full animate-spin" />
      </div>
    );
  }

  if (!user || user.role !== "candidate") {
    return (
      <div className="max-w-[1100px] mx-auto bg-white border border-[var(--border)] rounded-2xl p-12 text-center">
        <p className="font-display italic text-[18px] text-foreground">
          Connecte-toi cote candidat pour acceder a ton espace.
        </p>
        <Link
          href="/connexion"
          className="inline-flex h-10 mt-5 px-5 rounded-full bg-foreground text-background text-[13px] items-center"
        >
          Se connecter
        </Link>
      </div>
    );
  }

  const completion = profileCompletion(profile);
  const appCount = sbApplications.length;
  const savedCount = savedIds.length;
  const interviewing = sbApplications.filter(
    (a) => a.status === "interview",
  ).length;

  // Recommandations : prioriser les jobs des secteurs ciblés par le candidat
  // Recommandations : triées par match score, on ne prend que les offres
  // avec un score >= 50 (sinon c'est pas pertinent), max 6
  const reco = [...jobs]
    .map((j) => ({ job: j, score: matchScore(j, profile) }))
    .filter((x) => x.score >= 50)
    .sort((a, b) => b.score - a.score)
    .slice(0, 6)
    .map((x) => x.job);

  return (
    <div className="max-w-[1100px] mx-auto">
      {/* Hero */}
      <header className="bg-white border border-[var(--border)] rounded-2xl px-5 sm:px-7 lg:px-9 py-6 lg:py-7 mb-3">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex items-start gap-4 min-w-0">
            <UserAvatar user={user} size={56} />
            <div className="min-w-0">
              <p className="ed-label-sm">Mon espace candidat</p>
              <h1 className="font-display text-[22px] sm:text-[26px] lg:text-[28px] tracking-[-0.015em] text-foreground mt-1">
                Bonjour, {user.name.split(" ")[0]}.
              </h1>
              {profile.headline && (
                <p className="text-[13.5px] text-muted-foreground mt-1">
                  {profile.headline}
                </p>
              )}
            </div>
          </div>
          <Link
            href="/candidat/profil"
            className="h-10 px-3 sm:px-4 rounded-full border border-[var(--border)] bg-white text-[12.5px] sm:text-[13px] text-foreground/80 hover:text-foreground hover:bg-[var(--background-alt)] transition-colors flex items-center gap-2 shrink-0"
          >
            <UserCircle width={13} height={13} strokeWidth={2} />
            <span className="hidden sm:inline">Modifier mon profil</span>
            <span className="sm:hidden">Profil</span>
          </Link>
        </div>

        {/* Completion gauge */}
        {completion < 100 && (
          <div className="mt-5 pt-5 border-t border-[var(--border)]">
            <div className="flex items-center justify-between text-[12px] mb-2">
              <span className="text-foreground/60">
                Complétude du profil
                <span className="ml-2 text-foreground/45">
                  Plus tu remplis, plus tu attires les recruteurs.
                </span>
              </span>
              <span className="font-mono font-medium text-foreground tabular-nums">
                {completion}%
              </span>
            </div>
            <div className="h-2 rounded-full bg-[var(--background-alt)] overflow-hidden">
              <div
                className="h-full bg-[var(--accent)] rounded-full transition-[width] duration-500 ease-out"
                style={{ width: `${completion}%` }}
              />
            </div>
          </div>
        )}
      </header>

      {/* KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-3">
        <Kpi
          icon={SendMail}
          label="Candidatures"
          value={String(appCount)}
          tone={appCount > 0 ? "accent" : "muted"}
          href="/candidat/candidatures"
        />
        <Kpi
          icon={Calendar}
          label="En entretien"
          value={String(interviewing)}
          tone={interviewing > 0 ? "fresh" : "muted"}
          href="/candidat/candidatures"
        />
        <Kpi
          icon={Bookmark}
          label="Sauvegardées"
          value={String(savedCount)}
          tone="muted"
          href="/candidat/sauvegardes"
        />
        <Kpi
          icon={BellNotification}
          label="Alertes actives"
          value="0"
          tone="muted"
        />
      </div>

      {/* Body 2-col */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 items-start">
        {/* Colonne principale */}
        <div className="lg:col-span-2 flex flex-col gap-3">
          {/* Candidatures récentes */}
          <article className="bg-white border border-[var(--border)] rounded-2xl px-7 py-6">
            <div className="flex items-baseline justify-between mb-4">
              <div className="flex items-baseline gap-2.5">
                <h2 className="font-display text-[20px] tracking-[-0.01em]">
                  Candidatures récentes
                </h2>
                <span className="wall-badge" data-tone="muted">
                  <span className="font-mono">{appCount}</span>
                </span>
              </div>
              <Link
                href="/candidat/candidatures"
                className="text-[12.5px] text-[var(--accent)] hover:underline underline-offset-2"
              >
                Tout voir →
              </Link>
            </div>

            {sbApplications.length === 0 ? (
              <div className="py-10 text-center">
                <SendMail
                  width={22}
                  height={22}
                  strokeWidth={1.6}
                  className="text-foreground/35 inline-block"
                />
                <p className="text-[13px] text-muted-foreground mt-2">
                  Tu n&apos;as encore postulé à aucune offre.
                </p>
                <Link
                  href="/"
                  className="inline-flex h-9 mt-3 px-4 rounded-full bg-foreground text-background text-[12.5px] items-center"
                >
                  Parcourir le mur
                </Link>
              </div>
            ) : (
              <ul className="flex flex-col">
                {sbApplications.slice(0, 4).map((a) => (
                  <li key={a.id}>
                    <Link
                      href={`/candidat/candidatures/${a.id}`}
                      className="grid grid-cols-[auto_1fr_auto] items-center gap-3 py-2.5 -mx-2 px-2 rounded-lg hover:bg-[var(--background-alt)] transition-colors"
                    >
                      <CompanyLogo
                        name={a.companyName}
                        domain={a.companyDomain}
                        logoUrl={a.companyLogoUrl}
                        color={a.companyLogoColor}
                        initials={a.companyInitials}
                        size={36}
                        radius={11}
                      />
                      <div className="min-w-0">
                        <div className="text-[13.5px] font-medium text-foreground line-clamp-1">
                          {a.jobTitle}
                        </div>
                        <div className="text-[11.5px] text-muted-foreground truncate">
                          {a.companyName} · {formatRelative(a.appliedAt)}
                        </div>
                      </div>
                      <StatusBadge status={a.status as ApplicationStatus} />
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </article>

          {/* Recommandations */}
          <article className="bg-white border border-[var(--border)] rounded-2xl px-7 py-6">
            <div className="flex items-baseline justify-between mb-4">
              <div className="flex items-baseline gap-2.5">
                <h2 className="font-display text-[20px] tracking-[-0.01em]">
                  Recommandé pour toi
                </h2>
                <span className="wall-badge" data-tone="accent">
                  <Sparks /> {reco.length}
                </span>
              </div>
              <Link
                href="/"
                className="text-[12.5px] text-[var(--accent)] hover:underline underline-offset-2"
              >
                Voir tout le mur →
              </Link>
            </div>
            <ul className="flex flex-col">
              {reco.slice(0, 5).map((j) => (
                <li key={j.id}>
                  <Link
                    href={`/jobs/${j.slug}`}
                    className="grid grid-cols-[auto_1fr_auto] items-center gap-3 py-2.5 -mx-2 px-2 rounded-lg hover:bg-[var(--background-alt)] transition-colors group"
                  >
                    <CompanyLogo
                      name={j.company.name}
                      domain={j.company.domain}
                      color={j.company.logoColor}
                      initials={j.company.initials}
                      size={36}
                      radius={11}
                    />
                    <div className="min-w-0">
                      <div className="text-[13.5px] font-medium text-foreground line-clamp-1 group-hover:text-[var(--accent)] transition-colors">
                        {j.title}
                      </div>
                      <div className="text-[11.5px] text-muted-foreground truncate">
                        {j.company.name} · {j.type} · {j.location}
                      </div>
                    </div>
                    <ArrowUpRight
                      width={12}
                      height={12}
                      strokeWidth={2.2}
                      className="text-foreground/40 group-hover:text-[var(--accent)] transition-colors"
                    />
                  </Link>
                </li>
              ))}
            </ul>
          </article>
        </div>

        {/* Sidebar : actions + profil mini */}
        <aside className="lg:sticky lg:top-[80px] flex flex-col gap-3">
          <div className="bg-white border border-[var(--border)] rounded-2xl p-5">
            <p className="ed-label-sm mb-3">Actions rapides</p>
            <div className="flex flex-col">
              <ActionLink
                href="/"
                icon={Bag}
                label="Parcourir le mur"
                hint={`${jobs.length} offres en direct`}
              />
              <ActionLink
                href="/candidat/candidatures"
                icon={SendMail}
                label="Mes candidatures"
                hint={`${appCount} en cours`}
              />
              <ActionLink
                href="/candidat/sauvegardes"
                icon={Bookmark}
                label="Mes sauvegardes"
                hint={`${savedCount} offre${savedCount > 1 ? "s" : ""}`}
              />
              <ActionLink
                href="/candidat/profil"
                icon={UserCircle}
                label="Mon profil"
                hint={`${completion}% complété`}
              />
              <ActionLink
                href="/candidat/cv"
                icon={Download}
                label="Mon CV (PDF)"
                hint="Télécharger en un clic"
              />
            </div>
          </div>

          {/* CV mini */}
          <div className="bg-white border border-[var(--border)] rounded-2xl p-5">
            <p className="ed-label-sm mb-3">Mon CV</p>
            {profile.cv ? (
              <div className="flex items-start gap-3">
                <span className="size-9 rounded-xl bg-[var(--background-alt)] border border-[var(--border)] flex items-center justify-center text-foreground/60 shrink-0">
                  <PageStar width={14} height={14} strokeWidth={2} />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="text-[12.5px] font-medium text-foreground truncate">
                    {profile.cv.fileName}
                  </div>
                  <div className="text-[11px] text-muted-foreground mt-0.5">
                    {formatBytes(profile.cv.sizeBytes)} ·{" "}
                    {formatRelative(profile.cv.uploadedAt)}
                  </div>
                  <Link
                    href="/candidat/profil"
                    className="text-[11.5px] text-[var(--accent)] hover:underline underline-offset-2 mt-1 inline-block"
                  >
                    Mettre à jour →
                  </Link>
                </div>
              </div>
            ) : (
              <Link
                href="/candidat/profil"
                className="block rounded-xl border border-dashed border-[var(--border)] bg-[var(--background-alt)]/50 hover:bg-[var(--background-alt)] transition-colors p-4 text-center"
              >
                <PageStar
                  width={16}
                  height={16}
                  strokeWidth={2}
                  className="text-foreground/55 inline-block"
                />
                <div className="text-[12.5px] font-medium text-foreground mt-1.5">
                  Ajouter mon CV
                </div>
                <div className="text-[10.5px] text-muted-foreground mt-0.5">
                  PDF, DOC ou DOCX
                </div>
              </Link>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: ApplicationStatus }) {
  return (
    <span className="wall-badge" data-tone={statusTone(status)}>
      <StatusDot status={status} />
      {statusLabel(status)}
    </span>
  );
}

function StatusDot({ status }: { status: ApplicationStatus }) {
  const color = (() => {
    switch (status) {
      case "sent":
        return "var(--tertiary-foreground)";
      case "viewed":
        return "var(--accent)";
      case "interview":
        return "oklch(0.55 0.15 145)";
      case "accepted":
        return "oklch(0.55 0.15 145)";
      case "rejected":
        return "var(--destructive)";
    }
  })();
  return (
    <span
      className="size-1.5 rounded-full"
      style={{ background: color }}
      aria-hidden
    />
  );
}

function Kpi({
  icon: Icon,
  label,
  value,
  tone,
  href,
}: {
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  label: string;
  value: string;
  tone: "muted" | "accent" | "fresh";
  href?: string;
}) {
  const tile = (
    <div className="bg-white border border-[var(--border)] rounded-2xl p-4 flex items-center gap-3 hover:border-foreground/20 transition-colors">
      <span
        className={`size-10 rounded-xl flex items-center justify-center ${
          tone === "accent"
            ? "bg-[var(--accent)]/10 text-[var(--accent)]"
            : tone === "fresh"
              ? "bg-[oklch(0.92_0.12_145_/_0.18)] text-[oklch(0.42_0.13_145)]"
              : "bg-[var(--background-alt)] text-foreground/60"
        }`}
      >
        <Icon width={16} height={16} strokeWidth={2} />
      </span>
      <div>
        <div className="text-[11px] uppercase tracking-[0.08em] text-foreground/55 font-medium">
          {label}
        </div>
        <div className="font-display text-[22px] tracking-[-0.01em] text-foreground">
          {value}
        </div>
      </div>
    </div>
  );
  if (href) return <Link href={href}>{tile}</Link>;
  return tile;
}

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

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} o`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} Ko`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`;
}

function formatRelative(iso: string): string {
  const d = new Date(iso);
  const diffDays = Math.round(
    (Date.now() - d.getTime()) / (1000 * 60 * 60 * 24),
  );
  if (diffDays <= 0) return "aujourd'hui";
  if (diffDays === 1) return "hier";
  if (diffDays < 7) return `il y a ${diffDays} j`;
  if (diffDays < 30) return `il y a ${Math.round(diffDays / 7)} sem`;
  return `il y a ${Math.round(diffDays / 30)} mois`;
}
