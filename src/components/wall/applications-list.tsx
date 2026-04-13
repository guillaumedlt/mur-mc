"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowUpRight,
  Calendar,
  SendMail,
  Trash,
} from "iconoir-react";
import { useUser } from "@/lib/auth";
import {
  type ApplicationStatus,
  statusLabel,
  statusTone,
} from "@/lib/candidate-store";
import { useCandidateApplications, withdrawApplicationSupabase } from "@/lib/supabase/use-candidate-applications";
import { CompanyLogo } from "./company-logo";

const FILTERS: Array<{ key: ApplicationStatus | "all"; label: string }> = [
  { key: "all", label: "Toutes" },
  { key: "sent", label: "Envoyées" },
  { key: "viewed", label: "CV consulté" },
  { key: "interview", label: "Entretien" },
  { key: "accepted", label: "Acceptées" },
  { key: "rejected", label: "Refusées" },
];

// Map Supabase statuses to candidate-store statuses
function mapStatus(s: string): ApplicationStatus {
  switch (s) {
    case "received": return "sent";
    case "reviewed": return "viewed";
    case "interview": return "interview";
    case "offer":
    case "hired": return "accepted";
    case "rejected": return "rejected";
    default: return "sent";
  }
}

export function ApplicationsList() {
  const user = useUser();
  const router = useRouter();
  const { applications: sbApps, refetch } = useCandidateApplications();
  const [filter, setFilter] = useState<ApplicationStatus | "all">("all");

  useEffect(() => {
    if (user === null) {
      const t = window.setTimeout(() => router.replace("/connexion"), 50);
      return () => window.clearTimeout(t);
    }
  }, [user, router]);

  // Map Supabase apps to local format for display
  const apps = useMemo(() =>
    sbApps.map((a) => ({
      ...a,
      displayStatus: mapStatus(a.status),
    })),
    [sbApps],
  );

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: apps.length };
    for (const a of apps) c[a.displayStatus] = (c[a.displayStatus] ?? 0) + 1;
    return c;
  }, [apps]);

  const filtered = useMemo(() => {
    return filter === "all"
      ? apps
      : apps.filter((a) => a.displayStatus === filter);
  }, [apps, filter]);

  if (!user || user.role !== "candidate") {
    return (
      <div className="max-w-[1100px] mx-auto bg-white border border-[var(--border)] rounded-2xl p-12 text-center">
        <p className="font-display italic text-[18px] text-foreground">
          Connecte-toi côté candidat pour voir tes candidatures.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-[1100px] mx-auto">
      <Link
        href="/candidat"
        className="inline-flex items-center gap-1.5 text-[12.5px] text-foreground/55 hover:text-foreground transition-colors mb-3 px-1"
      >
        <ArrowLeft width={12} height={12} strokeWidth={2} />
        Mon espace candidat
      </Link>

      {/* Header */}
      <header className="bg-white border border-[var(--border)] rounded-2xl px-5 sm:px-7 lg:px-9 py-6 lg:py-7 mb-3">
        <p className="ed-label-sm">Suivi</p>
        <h1 className="font-display text-[24px] sm:text-[26px] lg:text-[30px] tracking-[-0.015em] text-foreground mt-1">
          Mes candidatures
        </h1>
        <p className="text-[14px] text-muted-foreground mt-2 max-w-xl">
          Toutes les offres auxquelles tu as postulé, et l&apos;avancement
          côté recruteur.
        </p>
      </header>

      {/* Filtres */}
      <div className="flex flex-wrap items-center gap-1.5 mb-3 px-1">
        {FILTERS.map((f) => {
          const active = filter === f.key;
          const count = counts[f.key] ?? 0;
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

      {/* Liste */}
      {filtered.length === 0 ? (
        <div className="bg-white border border-[var(--border)] rounded-2xl p-16 text-center">
          <SendMail
            width={24}
            height={24}
            strokeWidth={1.6}
            className="text-foreground/35 inline-block"
          />
          <p className="font-display italic text-[18px] text-foreground mt-3">
            {apps.length === 0
              ? "Tu n'as encore postule a aucune offre."
              : "Aucune candidature dans cette categorie."}
          </p>
          <Link
            href="/"
            className="inline-flex h-10 mt-5 px-5 rounded-full bg-foreground text-background text-[13px] items-center"
          >
            Parcourir le mur
          </Link>
        </div>
      ) : (
        <div className="bg-white border border-[var(--border)] rounded-2xl divide-y divide-[var(--border)]">
          {filtered.map((app) => (
            <ApplicationRow
              key={app.id}
              app={app}
              onWithdraw={async () => {
                await withdrawApplicationSupabase(app.id);
                refetch();
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function ApplicationRow({ app, onWithdraw }: { app: { id: string; jobTitle: string; jobSlug: string; companyName: string; companySlug: string; companyLogoColor: string; companyInitials: string; companyDomain?: string; companyLogoUrl?: string; appliedAt: string; displayStatus: ApplicationStatus }; onWithdraw: () => void }) {
  return (
    <div className="px-4 sm:px-6 lg:px-7 py-4 sm:py-5 grid grid-cols-[auto_1fr_auto] items-center gap-3 sm:gap-5 hover:bg-[var(--background-alt)]/40 transition-colors group">
      <CompanyLogo
        name={app.companyName}
        domain={app.companyDomain}
        logoUrl={app.companyLogoUrl}
        color={app.companyLogoColor}
        initials={app.companyInitials}
        size={44}
        radius={14}
      />

      <div className="min-w-0">
        <Link
          href={`/candidat/candidatures/${app.id}`}
          className="block group/title"
        >
          <h3 className="font-display text-[17px] leading-tight tracking-[-0.005em] text-foreground line-clamp-1 group-hover/title:text-[var(--accent)] transition-colors">
            {app.jobTitle}
          </h3>
        </Link>
        <div className="text-[12.5px] text-muted-foreground mt-1 flex items-center gap-2 flex-wrap">
          <Link
            href={`/entreprises/${app.companySlug}`}
            className="hover:text-foreground transition-colors"
          >
            {app.companyName}
          </Link>
          <span>·</span>
          <span className="inline-flex items-center gap-1">
            <Calendar width={11} height={11} strokeWidth={2} />
            {formatDate(app.appliedAt)}
          </span>
        </div>
        <div className="mt-2">
          <StatusPill status={app.displayStatus} />
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <button
          type="button"
          onClick={() => {
            if (window.confirm("Retirer cette candidature ?")) onWithdraw();
          }}
          className="size-8 rounded-full border border-[var(--border)] bg-white text-foreground/55 hover:text-destructive hover:border-destructive/30 transition-colors flex items-center justify-center"
          aria-label="Retirer la candidature"
        >
          <Trash width={12} height={12} strokeWidth={2} />
        </button>
        <Link
          href={`/jobs/${app.jobSlug}`}
          className="size-8 rounded-full border border-[var(--border)] bg-white text-foreground/60 hover:text-[var(--accent)] hover:border-[var(--accent)]/40 transition-colors flex items-center justify-center"
          aria-label="Voir l'offre"
        >
          <ArrowUpRight width={12} height={12} strokeWidth={2.2} />
        </Link>
      </div>
    </div>
  );
}

function StatusPill({ status }: { status: ApplicationStatus }) {
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

function formatDate(iso: string): string {
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
