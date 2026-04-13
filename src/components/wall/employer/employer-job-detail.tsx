"use client";

import { useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowUpRight,
  Bag,
  Building,
  Calendar,
  Check,
  Clock,
  EuroSquare,
  Eye,
  Globe,
  Group,
  MapPin,
  PauseSolid,
  PlaySolid,
  Sparks,
  Translate,
  Trash,
  UserCircle,
  Xmark,
} from "iconoir-react";
import type { EmployerApplicationStatus } from "@/lib/employer-store";
import { useUser } from "@/lib/auth";
import { useMyJob, updateJobSupabase, deleteJobSupabase } from "@/lib/supabase/use-my-jobs";
import { useMyApplications } from "@/lib/supabase/use-my-applications";
import { useManualCandidates } from "@/lib/supabase/use-manual-candidates";
import { ApplicationStatusPill, JobStatusPill } from "./status-pill";

type Props = { id: string };

export function EmployerJobDetail({ id }: Props) {
  const user = useUser();
  const router = useRouter();
  const { job, loading } = useMyJob(id);
  const { applications } = useMyApplications(id);
  const { candidates: manualCands } = useManualCandidates(id);

  const breakdown = useMemo(() => {
    const out: Record<EmployerApplicationStatus, number> = {
      received: 0, reviewed: 0, interview: 0, offer: 0, hired: 0, rejected: 0,
    };
    for (const a of applications) out[a.status]++;
    for (const mc of manualCands) {
      const s = mc.status as EmployerApplicationStatus;
      if (s in out) out[s]++;
    }
    return out;
  }, [applications, manualCands]);

  const totalApps = applications.length + manualCands.length;

  if (!user || user.role !== "employer") return null;

  if (loading) {
    return (
      <div className="max-w-[1100px] mx-auto bg-white border border-[var(--border)] rounded-2xl p-12 flex items-center justify-center">
        <span className="size-5 border-2 border-foreground/20 border-t-foreground rounded-full animate-spin" />
      </div>
    );
  }

  if (!job) {
    return (
      <div className="max-w-[1100px] mx-auto bg-white border border-[var(--border)] rounded-2xl p-12 text-center">
        <p className="font-display italic text-[18px] text-foreground">
          Cette offre n&apos;existe plus.
        </p>
        <Link
          href="/recruteur/offres"
          className="inline-flex h-10 mt-5 px-5 rounded-full bg-foreground text-background text-[13px] items-center"
        >
          Toutes mes offres
        </Link>
      </div>
    );
  }

  const togglePause = async () => {
    const next = job.status === "paused" ? "published" : "paused";
    await updateJobSupabase(job.id, { status: next });
    router.refresh();
  };
  const close = async () => {
    if (window.confirm("Fermer cette offre ? Elle n'apparaitra plus dans le mur.")) {
      await updateJobSupabase(job.id, { status: "closed" });
      router.refresh();
    }
  };
  const onDelete = async () => {
    if (window.confirm("Supprimer definitivement cette offre et toutes ses candidatures ?")) {
      await deleteJobSupabase(job.id);
      router.push("/recruteur/offres");
    }
  };

  const salary = formatSalary(job.salary_min, job.salary_max);

  return (
    <div className="max-w-[1100px] mx-auto">
      <Link
        href="/recruteur/offres"
        className="inline-flex items-center gap-1.5 text-[12.5px] text-foreground/55 hover:text-foreground transition-colors mb-3 px-1"
      >
        <ArrowLeft width={12} height={12} strokeWidth={2} />
        Toutes mes offres
      </Link>

      {/* Hero */}
      <header className="bg-white border border-[var(--border)] rounded-2xl px-5 sm:px-7 lg:px-9 py-6 lg:py-8 mb-3">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2.5 flex-wrap">
              <p className="ed-label-sm">Offre</p>
              <JobStatusPill status={job.status as "draft" | "published" | "paused" | "closed"} />
            </div>
            <h1 className="font-display text-[26px] sm:text-[30px] lg:text-[36px] leading-[1.08] tracking-[-0.015em] text-foreground mt-2">
              {job.title}
            </h1>

            {/* Badges */}
            <div className="flex flex-wrap items-center gap-1.5 mt-4">
              <span className="wall-badge" data-tone="muted">
                <Bag /> {job.type}
              </span>
              <span className="wall-badge" data-tone="muted">
                <Building /> {job.sector}
              </span>
              <span className="wall-badge" data-tone="muted">
                <MapPin /> {job.location}
              </span>
              <span className="wall-badge" data-tone="muted">
                <Clock /> {job.work_time}
              </span>
              {job.remote && job.remote !== "Sur site" && (
                <span className="wall-badge" data-tone="accent">
                  <Globe /> {job.remote}
                </span>
              )}
              {job.featured && (
                <span className="wall-badge" data-tone="accent">
                  <Sparks /> Mise en avant
                </span>
              )}
            </div>
          </div>
          <Link
            href={`/recruteur/offres/${job.id}/candidats`}
            className="h-10 px-4 rounded-full bg-foreground text-background text-[13px] font-medium hover:bg-foreground/85 transition-colors flex items-center gap-2 shrink-0"
          >
            <Group width={14} height={14} strokeWidth={2} />
            Voir candidats ({totalApps})
          </Link>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 items-start">
        {/* Colonne principale */}
        <div className="lg:col-span-2 flex flex-col gap-3">

          {/* Stats KPI */}
          <article className="bg-white border border-[var(--border)] rounded-2xl px-5 sm:px-7 lg:px-9 py-6 lg:py-7">
            <h2 className="font-display text-[20px] tracking-[-0.01em] mb-5">
              Performance
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6">
              <Stat icon={Eye} label="Vues" value={(job.views ?? 0).toLocaleString("fr-FR")} />
              <Stat icon={Group} label="Candidatures" value={String(totalApps)} />
              <Stat
                icon={Calendar}
                label="En entretien"
                value={String((breakdown.interview ?? 0) + (breakdown.offer ?? 0))}
              />
            </div>
            {totalApps > 0 && (
              <div className="flex flex-col gap-2.5">
                {(["received", "reviewed", "interview", "offer", "hired", "rejected"] as EmployerApplicationStatus[]).map(
                  (s) => {
                    const count = breakdown[s];
                    const pct = totalApps > 0 ? Math.round((count / totalApps) * 100) : 0;
                    return (
                      <div key={s} className="flex items-center gap-3 text-[12px]">
                        <div className="w-[110px] shrink-0">
                          <ApplicationStatusPill status={s} />
                        </div>
                        <div className="flex-1 h-1.5 rounded-full bg-[var(--background-alt)] overflow-hidden">
                          <div
                            className="h-full rounded-full bg-foreground/85 transition-[width] duration-500"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <span className="font-mono tabular-nums w-8 text-right text-foreground/70">
                          {count}
                        </span>
                      </div>
                    );
                  },
                )}
              </div>
            )}
          </article>

          {/* Accroche + Description */}
          <article className="bg-white border border-[var(--border)] rounded-2xl px-5 sm:px-7 lg:px-9 py-6 lg:py-8">
            <h2 className="font-display text-[20px] tracking-[-0.01em] mb-5">
              Description de l&apos;offre
            </h2>

            {job.short_description && (
              <p className="font-display italic text-[17px] leading-[1.6] text-foreground/90 mb-6">
                {job.short_description}
              </p>
            )}

            {job.description && job.description !== job.short_description && (
              <p className="text-[14.5px] leading-[1.75] text-foreground/85 whitespace-pre-line">
                {job.description}
              </p>
            )}
          </article>

          {/* Responsabilites */}
          <ListSection
            title="Responsabilités"
            items={job.responsibilities}
            icon={Check}
          />

          {/* Profil recherche */}
          <ListSection
            title="Profil recherché"
            items={job.requirements}
            icon={UserCircle}
          />

          {/* Avantages */}
          <ListSection
            title="Avantages"
            items={job.benefits}
            icon={Sparks}
          />

          {/* Tags */}
          {job.tags.length > 0 && (
            <article className="bg-white border border-[var(--border)] rounded-2xl px-5 sm:px-7 lg:px-9 py-6 lg:py-7">
              <h2 className="font-display text-[20px] tracking-[-0.01em] mb-4">
                Tags
              </h2>
              <div className="flex flex-wrap gap-1.5">
                {job.tags.map((tag) => (
                  <span
                    key={tag}
                    className="h-7 px-2.5 rounded-full text-[11.5px] bg-[var(--background-alt)] border border-[var(--border)] text-foreground/75"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            </article>
          )}
        </div>

        {/* Sidebar */}
        <aside className="lg:sticky lg:top-[140px] flex flex-col gap-3">
          {/* Details */}
          <div className="bg-white border border-[var(--border)] rounded-2xl p-5">
            <p className="ed-label-sm mb-4">Détails</p>
            <dl className="flex flex-col gap-3">
              <Detail icon={Bag} label="Contrat" value={job.type} />
              <Detail icon={Building} label="Secteur" value={job.sector} />
              <Detail icon={MapPin} label="Lieu" value={job.location} />
              <Detail icon={Globe} label="Mode" value={job.remote} />
              <Detail icon={Clock} label="Temps" value={job.work_time} />
              <Detail icon={UserCircle} label="Niveau" value={job.level} />
              {salary && <Detail icon={EuroSquare} label="Salaire" value={salary} />}
              {job.languages.length > 0 && (
                <Detail icon={Translate} label="Langues" value={job.languages.join(" · ")} />
              )}
              <Detail icon={Calendar} label="Créée" value={formatDate(job.created_at)} />
              <Detail icon={Calendar} label="Modifiée" value={formatDate(job.updated_at)} />
              <Detail icon={Globe} label="Langue" value={job.lang === "en" ? "Anglais" : "Français"} />
            </dl>
          </div>

          {/* Actions */}
          <div className="bg-white border border-[var(--border)] rounded-2xl p-5">
            <p className="ed-label-sm mb-3">Actions</p>
            <div className="flex flex-col gap-2">
              <Link
                href={`/recruteur/offres/${job.id}/candidats`}
                className="h-10 px-4 rounded-xl bg-foreground text-background text-[12.5px] font-medium hover:bg-foreground/85 transition-colors flex items-center justify-center gap-2"
              >
                <Group width={13} height={13} strokeWidth={2} />
                Pipeline candidats
              </Link>
              {job.status === "published" || job.status === "draft" ? (
                <button
                  type="button"
                  onClick={togglePause}
                  className="h-10 px-4 rounded-xl border border-[var(--border)] bg-white text-[12.5px] text-foreground/85 hover:bg-[var(--background-alt)] transition-colors flex items-center justify-center gap-2"
                >
                  <PauseSolid width={12} height={12} />
                  Mettre en pause
                </button>
              ) : job.status === "paused" ? (
                <button
                  type="button"
                  onClick={togglePause}
                  className="h-10 px-4 rounded-xl border border-[var(--border)] bg-white text-[12.5px] text-foreground/85 hover:bg-[var(--background-alt)] transition-colors flex items-center justify-center gap-2"
                >
                  <PlaySolid width={12} height={12} strokeWidth={2} />
                  Reprendre
                </button>
              ) : null}
              {job.status !== "closed" && (
                <button
                  type="button"
                  onClick={close}
                  className="h-10 px-4 rounded-xl border border-[var(--border)] bg-white text-[12.5px] text-foreground/65 hover:text-foreground hover:bg-[var(--background-alt)] transition-colors flex items-center justify-center gap-2"
                >
                  <Xmark width={12} height={12} strokeWidth={2.2} />
                  Fermer l&apos;offre
                </button>
              )}
              <button
                type="button"
                onClick={onDelete}
                className="h-10 px-4 rounded-xl border border-[var(--border)] bg-white text-[12.5px] text-foreground/55 hover:text-destructive hover:border-destructive/30 transition-colors flex items-center justify-center gap-2"
              >
                <Trash width={12} height={12} strokeWidth={2} />
                Supprimer
              </button>
            </div>
          </div>

          {/* Lien public */}
          <div className="bg-white border border-[var(--border)] rounded-2xl p-5">
            <p className="ed-label-sm mb-3">Lien public</p>
            <Link
              href={`/jobs/${job.slug}`}
              target="_blank"
              className="text-[12.5px] text-[var(--accent)] hover:underline underline-offset-2 inline-flex items-center gap-1"
            >
              Voir l&apos;offre sur le mur
              <ArrowUpRight width={11} height={11} strokeWidth={2.2} />
            </Link>
          </div>
        </aside>
      </div>
    </div>
  );
}

/* ─── Sub-components ─── */

function ListSection({
  title,
  items,
  icon: Icon,
}: {
  title: string;
  items: string[];
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
}) {
  if (!items || items.length === 0) return null;
  return (
    <article className="bg-white border border-[var(--border)] rounded-2xl px-5 sm:px-7 lg:px-9 py-6 lg:py-7">
      <h2 className="font-display text-[20px] tracking-[-0.01em] mb-5">
        {title}
      </h2>
      <ul className="flex flex-col gap-3">
        {items.map((it, i) => (
          <li key={i} className="flex items-start gap-3">
            <span className="mt-[3px] size-[20px] rounded-md bg-[var(--accent)]/10 text-[var(--accent)] flex items-center justify-center shrink-0">
              <Icon width={12} height={12} strokeWidth={2.4} />
            </span>
            <span className="text-[14px] text-foreground/85 leading-[1.65]">
              {it}
            </span>
          </li>
        ))}
      </ul>
    </article>
  );
}

function Stat({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  label: string;
  value: string;
}) {
  return (
    <div className="bg-[var(--background-alt)] rounded-xl p-3.5 flex items-center gap-3">
      <span className="size-10 rounded-lg bg-white border border-[var(--border)] flex items-center justify-center text-foreground/60">
        <Icon width={15} height={15} strokeWidth={2} />
      </span>
      <div className="min-w-0">
        <div className="text-[10.5px] uppercase tracking-[0.08em] text-foreground/55 font-medium">
          {label}
        </div>
        <div className="font-display text-[20px] tracking-[-0.01em] text-foreground tabular-nums">
          {value}
        </div>
      </div>
    </div>
  );
}

function Detail({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-2.5 text-[13px]">
      <Icon
        width={13}
        height={13}
        strokeWidth={2}
        className="mt-[3px] text-foreground/45 shrink-0"
      />
      <div className="min-w-0 flex-1 flex items-baseline justify-between gap-3">
        <dt className="text-foreground/55">{label}</dt>
        <dd className="text-foreground text-right">{value}</dd>
      </div>
    </div>
  );
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function formatSalary(min: number | null, max: number | null): string | null {
  if (!min && !max) return null;
  const fmt = (n: number) => `${Math.round(n / 1000)}k`;
  if (min && max) return `${fmt(min)} - ${fmt(max)} EUR/an`;
  if (min) return `A partir de ${fmt(min)} EUR/an`;
  if (max) return `Jusqu'a ${fmt(max)} EUR/an`;
  return null;
}
