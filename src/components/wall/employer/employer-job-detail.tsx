"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowUpRight,
  Building,
  Calendar,
  Eye,
  Group,
  MapPin,
  PauseSolid,
  PlaySolid,
  PlusCircle,
  Trash,
  Xmark,
} from "iconoir-react";
import {
  type EmployerApplicationStatus,
  applicationsByStatus,
  deleteJob,
  setJobStatus,
  useEmployer,
} from "@/lib/employer-store";
import { useUser } from "@/lib/auth";
import { ApplicationStatusPill, JobStatusPill } from "./status-pill";
import { PublishJobForm } from "./publish-job-form";

type Props = { id: string };

export function EmployerJobDetail({ id }: Props) {
  const user = useUser();
  const router = useRouter();
  const { jobs } = useEmployer();
  const job = jobs.find((j) => j.id === id);
  const [editing, setEditing] = useState(false);

  // Lock body scroll quand le drawer d'édition est ouvert
  useEffect(() => {
    if (!editing || typeof document === "undefined") return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [editing]);

  const breakdown = useMemo(() => {
    if (!job) return null;
    return applicationsByStatus(job.id);
  }, [job]);

  const totalApps = useMemo(() => {
    if (!breakdown) return 0;
    return Object.values(breakdown).reduce((s, arr) => s + arr.length, 0);
  }, [breakdown]);

  if (!user || user.role !== "employer") return null;

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

  const togglePause = () => {
    setJobStatus(job.id, job.status === "paused" ? "published" : "paused");
  };
  const close = () => {
    if (window.confirm("Fermer cette offre ? Elle n'apparaîtra plus dans le mur.")) {
      setJobStatus(job.id, "closed");
    }
  };
  const onDelete = () => {
    if (
      window.confirm(
        "Supprimer définitivement cette offre et toutes ses candidatures ?",
      )
    ) {
      deleteJob(job.id);
      router.push("/recruteur/offres");
    }
  };

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
      <header className="bg-white border border-[var(--border)] rounded-2xl px-5 sm:px-7 lg:px-9 py-6 lg:py-7 mb-3">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <p className="ed-label-sm">Offre</p>
              <JobStatusPill status={job.status} />
            </div>
            <h1 className="font-display text-[24px] sm:text-[28px] lg:text-[32px] leading-[1.08] tracking-[-0.015em] text-foreground mt-1.5">
              {job.title}
            </h1>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 mt-3 text-[12.5px] text-foreground/65">
              <span className="inline-flex items-center gap-1.5">
                <Building width={12} height={12} strokeWidth={2} />
                {job.type} · {job.sector}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <MapPin width={12} height={12} strokeWidth={2} />
                {job.location}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Calendar width={12} height={12} strokeWidth={2} />
                Créée {formatDate(job.createdAt)}
              </span>
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
        {/* Colonne gauche : description + breakdown */}
        <div className="lg:col-span-2 flex flex-col gap-3">
          {/* Stats KPI */}
          <article className="bg-white border border-[var(--border)] rounded-2xl px-5 sm:px-7 lg:px-9 py-6 lg:py-7">
            <h2 className="font-display text-[20px] tracking-[-0.01em] mb-5">
              Performance
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6">
              <Stat icon={Eye} label="Vues" value={job.views.toLocaleString("fr-FR")} />
              <Stat icon={Group} label="Candidatures" value={String(totalApps)} />
              <Stat
                icon={Calendar}
                label="En entretien"
                value={String((breakdown?.interview.length ?? 0) + (breakdown?.offer.length ?? 0))}
              />
            </div>
            {breakdown && totalApps > 0 && (
              <div className="flex flex-col gap-2.5">
                {(["received", "reviewed", "interview", "offer", "hired", "rejected"] as EmployerApplicationStatus[]).map(
                  (s) => {
                    const count = breakdown[s].length;
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

          {/* Description */}
          <article className="bg-white border border-[var(--border)] rounded-2xl px-5 sm:px-7 lg:px-9 py-6 lg:py-7">
            <h2 className="font-display text-[20px] tracking-[-0.01em] mb-4">
              Description
            </h2>
            <p className="font-display italic text-[15px] leading-[1.6] text-foreground/85">
              {job.shortDescription}
            </p>
            {job.description && job.description !== job.shortDescription && (
              <p className="text-[14px] leading-[1.7] text-foreground/80 mt-4">
                {job.description}
              </p>
            )}
          </article>
        </div>

        {/* Sidebar : actions */}
        <aside className="lg:sticky lg:top-[140px] flex flex-col gap-3">
          <div className="bg-white border border-[var(--border)] rounded-2xl p-5">
            <p className="ed-label-sm mb-3">Actions</p>
            <div className="flex flex-col gap-2">
              <button
                type="button"
                onClick={() => setEditing(true)}
                className="h-10 px-4 rounded-xl bg-foreground text-background text-[12.5px] font-medium hover:bg-foreground/85 transition-colors flex items-center justify-center gap-2"
              >
                <PlusCircle width={13} height={13} strokeWidth={2} />
                Modifier l&apos;offre
              </button>
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

          <div className="bg-white border border-[var(--border)] rounded-2xl p-5">
            <p className="ed-label-sm mb-3">Liens</p>
            <Link
              href={`/recruteur/offres/${job.id}/candidats`}
              className="block py-2 text-[12.5px] text-foreground/85 hover:text-foreground border-b border-[var(--border)] last:border-b-0"
            >
              Pipeline candidats
              <ArrowUpRight
                width={11}
                height={11}
                strokeWidth={2.2}
                className="inline ml-1 text-foreground/40"
              />
            </Link>
          </div>
        </aside>
      </div>

      {/* Edit drawer */}
      {editing && (
        <div
          className="fixed inset-0 z-50 bg-foreground/30 backdrop-blur-[2px] flex items-start justify-center pt-[4vh] px-3 overflow-y-auto"
          onClick={() => setEditing(false)}
        >
          <div
            className="w-full max-w-[820px] mb-6"
            onClick={(e) => e.stopPropagation()}
          >
            <PublishJobForm existing={job} onCancel={() => setEditing(false)} />
          </div>
        </div>
      )}
    </div>
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
    <div className="bg-[var(--background-alt)] rounded-xl p-3 flex items-center gap-2.5">
      <span className="size-9 rounded-lg bg-white border border-[var(--border)] flex items-center justify-center text-foreground/60">
        <Icon width={14} height={14} strokeWidth={2} />
      </span>
      <div className="min-w-0">
        <div className="text-[10.5px] uppercase tracking-[0.08em] text-foreground/55 font-medium">
          {label}
        </div>
        <div className="font-display text-[18px] tracking-[-0.01em] text-foreground tabular-nums">
          {value}
        </div>
      </div>
    </div>
  );
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "short",
  });
}
