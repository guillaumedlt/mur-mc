"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowUpRight,
  BadgeCheck,
  Calendar,
  Eye,
  Mail,
  SendMail,
  Trash,
  UserCircle,
} from "iconoir-react";
import { useUser } from "@/lib/auth";
import {
  type ApplicationStatus,
  statusLabel,
  statusTone,
} from "@/lib/candidate-store";
import {
  useCandidateApplications,
  withdrawApplicationSupabase,
} from "@/lib/supabase/use-candidate-applications";
import { CompanyLogo } from "./company-logo";

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

type Props = { id: string };

export function ApplicationDetail({ id }: Props) {
  const user = useUser();
  const router = useRouter();
  const { applications, loading, refetch } = useCandidateApplications();
  const app = applications.find((a) => a.id === id);

  useEffect(() => {
    if (user === null) {
      const t = window.setTimeout(() => router.replace("/connexion"), 50);
      return () => window.clearTimeout(t);
    }
  }, [user, router]);

  if (!user || user.role !== "candidate") {
    return (
      <div className="max-w-[900px] mx-auto bg-white border border-[var(--border)] rounded-2xl p-12 text-center">
        <p className="font-display italic text-[18px] text-foreground">
          Connecte-toi cote candidat pour voir cette candidature.
        </p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="max-w-[900px] mx-auto bg-white border border-[var(--border)] rounded-2xl p-12 flex items-center justify-center">
        <span className="size-5 border-2 border-foreground/20 border-t-foreground rounded-full animate-spin" />
      </div>
    );
  }

  if (!app) {
    return (
      <div className="max-w-[900px] mx-auto bg-white border border-[var(--border)] rounded-2xl p-12 text-center">
        <p className="font-display italic text-[18px] text-foreground">
          Cette candidature n&apos;existe plus.
        </p>
        <Link
          href="/candidat/candidatures"
          className="inline-flex h-10 mt-5 px-5 rounded-full bg-foreground text-background text-[13px] items-center"
        >
          Retour aux candidatures
        </Link>
      </div>
    );
  }

  const displayStatus = mapStatus(app.status);
  const events = [...app.events].sort((a, b) =>
    b.createdAt.localeCompare(a.createdAt),
  );

  return (
    <div className="max-w-[900px] mx-auto">
      <Link
        href="/candidat/candidatures"
        className="inline-flex items-center gap-1.5 text-[12.5px] text-foreground/55 hover:text-foreground transition-colors mb-3 px-1"
      >
        <ArrowLeft width={12} height={12} strokeWidth={2} />
        Mes candidatures
      </Link>

      {/* Hero */}
      <header className="bg-white border border-[var(--border)] rounded-2xl px-5 sm:px-7 lg:px-9 py-6 lg:py-7 mb-3">
        <div className="flex items-start gap-5">
          <CompanyLogo
            name={app.companyName}
            domain={app.companyDomain}
            logoUrl={app.companyLogoUrl}
            color={app.companyLogoColor}
            initials={app.companyInitials}
            size={60}
            radius={16}
          />
          <div className="min-w-0 flex-1">
            <Link
              href={`/entreprises/${app.companySlug}`}
              className="ed-label-sm hover:text-foreground transition-colors inline-flex items-center gap-1"
            >
              {app.companyName}
              <ArrowUpRight width={10} height={10} strokeWidth={2.4} />
            </Link>
            <h1 className="font-display text-[28px] leading-[1.1] tracking-[-0.015em] text-foreground mt-1">
              {app.jobTitle}
            </h1>
            <div className="flex flex-wrap items-center gap-2 mt-3">
              <span className="wall-badge" data-tone={statusTone(displayStatus)}>
                {statusLabel(displayStatus)}
              </span>
            </div>
          </div>

          <Link
            href={`/jobs/${app.jobSlug}`}
            className="size-9 rounded-full border border-[var(--border)] bg-white text-foreground/60 hover:text-[var(--accent)] hover:border-[var(--accent)]/40 transition-colors flex items-center justify-center shrink-0"
            aria-label="Voir l'offre"
          >
            <ArrowUpRight width={13} height={13} strokeWidth={2.2} />
          </Link>
        </div>
      </header>

      {/* Body 2-col */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 items-start">
        {/* Timeline */}
        <article className="lg:col-span-2 bg-white border border-[var(--border)] rounded-2xl px-5 sm:px-7 lg:px-9 py-6 lg:py-8">
          <h2 className="font-display text-[20px] tracking-[-0.01em] text-foreground mb-6">
            Suivi de la candidature
          </h2>

          {events.length === 0 ? (
            <p className="text-[13px] text-muted-foreground italic">
              Aucun evenement pour l&apos;instant.
            </p>
          ) : (
            <ol className="relative">
              <span
                className="absolute left-[15px] top-2 bottom-2 w-px bg-[var(--border)]"
                aria-hidden
              />
              {events.map((evt) => (
                <li key={evt.id} className="relative pl-11 pb-6 last:pb-0">
                  <span className="absolute left-0 top-0.5 size-8 rounded-full bg-white border border-[var(--border)] flex items-center justify-center">
                    <EventIcon type={evt.type} />
                  </span>
                  <div>
                    <div className="flex items-baseline gap-2 flex-wrap">
                      <h3 className="text-[14px] font-medium text-foreground">
                        {eventTypeLabel(evt.type)}
                      </h3>
                      <time
                        className="text-[11.5px] font-mono text-[var(--tertiary-foreground)]"
                        dateTime={evt.createdAt}
                      >
                        {formatRelative(evt.createdAt)}
                      </time>
                    </div>
                    {evt.by && (
                      <p className="text-[12px] text-muted-foreground mt-0.5">
                        {evt.by}
                      </p>
                    )}
                    {evt.text && (
                      <p className="text-[13px] mt-2 leading-[1.6] text-foreground/75">
                        {evt.text}
                      </p>
                    )}
                  </div>
                </li>
              ))}
            </ol>
          )}

          {/* Cover letter */}
          {app.coverLetter && (
            <div className="mt-8 pt-6 border-t border-[var(--border)]">
              <p className="ed-label-sm mb-2">Lettre de motivation</p>
              <p className="text-[13.5px] text-foreground/85 leading-[1.7] whitespace-pre-line">
                {app.coverLetter}
              </p>
            </div>
          )}
        </article>

        {/* Sidebar */}
        <aside className="lg:sticky lg:top-[80px] flex flex-col gap-3">
          <div className="bg-white border border-[var(--border)] rounded-2xl p-5">
            <p className="ed-label-sm mb-3">Details</p>
            <dl className="flex flex-col gap-2 text-[13px]">
              <Row label="Postule" value={formatDate(app.appliedAt)} />
              <Row label="Statut" value={statusLabel(displayStatus)} />
              <Row label="Ref" value={app.id.slice(0, 12).toUpperCase()} />
            </dl>
          </div>

          <div className="bg-white border border-[var(--border)] rounded-2xl p-5">
            <p className="ed-label-sm mb-3">Actions</p>
            <div className="flex flex-col gap-2">
              <Link
                href={`/jobs/${app.jobSlug}`}
                className="h-9 rounded-xl border border-[var(--border)] bg-white text-[12.5px] text-foreground/85 hover:text-foreground hover:bg-[var(--background-alt)] transition-colors flex items-center justify-center gap-1.5"
              >
                <ArrowUpRight width={12} height={12} strokeWidth={2.2} />
                Voir l&apos;offre
              </Link>
              <button
                type="button"
                onClick={async () => {
                  if (!window.confirm("Retirer cette candidature ?")) return;
                  const res = await withdrawApplicationSupabase(app.id);
                  if (!res.ok) {
                    window.alert(res.error ?? "Impossible de retirer la candidature");
                    return;
                  }
                  refetch();
                  router.push("/candidat/candidatures");
                }}
                className="h-9 rounded-xl border border-[var(--border)] bg-white text-[12.5px] text-foreground/65 hover:text-destructive hover:border-destructive/30 transition-colors flex items-center justify-center gap-1.5"
              >
                <Trash width={12} height={12} strokeWidth={2} />
                Retirer ma candidature
              </button>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

/* ─── Helpers ─── */

function EventIcon({ type }: { type: string }) {
  const cls = "text-foreground/50";
  switch (type) {
    case "received":
      return <SendMail width={13} height={13} strokeWidth={2} className={cls} />;
    case "cv_viewed":
      return <Eye width={13} height={13} strokeWidth={2} className={cls} />;
    case "status_changed":
      return <BadgeCheck width={13} height={13} strokeWidth={2} className={cls} />;
    case "message_sent":
      return <Mail width={13} height={13} strokeWidth={2} className={cls} />;
    case "interview_scheduled":
      return <Calendar width={13} height={13} strokeWidth={2} className={cls} />;
    case "offer_sent":
      return <BadgeCheck width={13} height={13} strokeWidth={2} className="text-[var(--accent)]" />;
    case "hired":
      return <BadgeCheck width={13} height={13} strokeWidth={2} className="text-[var(--accent)]" />;
    case "rejected":
      return <Trash width={13} height={13} strokeWidth={2} className="text-destructive" />;
    default:
      return <UserCircle width={13} height={13} strokeWidth={2} className={cls} />;
  }
}

function eventTypeLabel(type: string): string {
  switch (type) {
    case "received": return "Candidature recue";
    case "cv_viewed": return "CV consulte";
    case "status_changed": return "Statut modifie";
    case "message_sent": return "Message du recruteur";
    case "note_added": return "Note ajoutee";
    case "interview_scheduled": return "Entretien planifie";
    case "offer_sent": return "Offre envoyee";
    case "hired": return "Embauche";
    case "rejected": return "Refusee";
    default: return type;
  }
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <dt className="text-foreground/55">{label}</dt>
      <dd className="text-foreground text-right">{value}</dd>
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

function formatRelative(iso: string): string {
  const d = new Date(iso);
  const diff = Math.round((Date.now() - d.getTime()) / (1000 * 60 * 60 * 24));
  if (diff <= 0) return "aujourd'hui";
  if (diff === 1) return "hier";
  if (diff < 7) return `il y a ${diff}j`;
  if (diff < 30) return `il y a ${Math.round(diff / 7)} sem.`;
  return formatDate(iso);
}
