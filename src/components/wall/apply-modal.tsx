"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  BadgeCheck,
  Page,
  Sparks,
  Xmark,
} from "iconoir-react";
import type { Job } from "@/lib/data";
import {
  type AuthUser,
} from "@/lib/auth";
import {
  createApplication,
  matchScore,
  useCandidate,
} from "@/lib/candidate-store";
import { CompanyLogo } from "./company-logo";

type Props = {
  job: Job;
  user: AuthUser;
  open: boolean;
  onClose: () => void;
};

export function ApplyModal({ job, user, open, onClose }: Props) {
  const { profile } = useCandidate();
  const [coverLetter, setCoverLetter] = useState("");
  const [sent, setSent] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  const score = matchScore(job, profile);
  const hasCv = !!profile.cv;

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // 1. Sauver dans le store local (pour le dashboard candidat)
    createApplication({
      jobId: job.id,
      jobSlug: job.slug,
      jobTitle: job.title,
      jobType: job.type,
      jobLocation: job.location,
      companyId: job.company.id,
      companySlug: job.company.slug,
      companyName: job.company.name,
      companyDomain: job.company.domain,
      companyColor: job.company.logoColor,
      companyInitials: job.company.initials,
      coverLetter: coverLetter.trim() || undefined,
    });

    // 2. Inserer dans Supabase (pour que le recruteur voie la candidature)
    if (user) {
      const { createClient } = await import("@/lib/supabase/client");
      const supabase = createClient();
      await supabase.from("applications").insert({
        job_id: job.id,
        candidate_id: user.id,
        status: "received",
        cover_letter: coverLetter.trim() || null,
        source: "platform",
        match_score: score,
      });
      await supabase.from("application_events").insert({
        application_id: job.id, // sera corrige quand on aura l'id
        type: "received",
        text: coverLetter.trim()
          ? "Candidature recue avec lettre de motivation"
          : "Candidature recue",
        by_name: user.name,
      });
    }

    setSent(true);
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-foreground/15 backdrop-blur-[2px] flex items-start justify-center pt-[6vh] px-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-[560px] bg-white rounded-2xl border border-[var(--border)] shadow-[0_24px_60px_rgba(10,10,10,0.18)] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {sent ? (
          <SuccessView job={job} onClose={onClose} />
        ) : (
          <form onSubmit={onSubmit}>
            {/* Header */}
            <div className="px-7 pt-6 pb-5 flex items-start justify-between gap-3 border-b border-[var(--border)]">
              <div className="flex items-start gap-3 min-w-0">
                <CompanyLogo
                  name={job.company.name}
                  domain={job.company.domain}
                  color={job.company.logoColor}
                  initials={job.company.initials}
                  size={44}
                  radius={14}
                />
                <div className="min-w-0">
                  <p className="ed-label-sm">Postuler à</p>
                  <h2 className="font-display text-[20px] leading-tight tracking-[-0.005em] text-foreground line-clamp-2 mt-0.5">
                    {job.title}
                  </h2>
                  <p className="text-[12px] text-muted-foreground mt-1">
                    {job.company.name} · {job.location}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="size-8 rounded-full hover:bg-foreground/5 flex items-center justify-center text-foreground/55 hover:text-foreground transition-colors shrink-0"
                aria-label="Fermer"
              >
                <Xmark width={14} height={14} strokeWidth={2.2} />
              </button>
            </div>

            {/* Body */}
            <div className="px-7 py-6 flex flex-col gap-5">
              {/* Profile preview */}
              <div className="rounded-xl bg-[var(--background-alt)] p-3.5 flex items-center gap-3">
                <div
                  className="size-10 rounded-xl flex items-center justify-center text-white font-display text-[14px] font-medium ring-1 ring-black/5"
                  style={{
                    background: `linear-gradient(155deg, ${user.avatarColor}, #122a3f)`,
                  }}
                >
                  {user.initials}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-[13px] font-medium text-foreground truncate">
                    {profile.fullName || user.name}
                  </div>
                  <div className="text-[11.5px] text-muted-foreground truncate">
                    {profile.headline || "Profil candidat"}
                  </div>
                </div>
                {score >= 65 && (
                  <span className="wall-badge" data-tone="accent">
                    <Sparks /> {score}%
                  </span>
                )}
              </div>

              {/* CV check */}
              <div
                className={`rounded-xl border p-3 flex items-center gap-3 text-[12.5px] ${
                  hasCv
                    ? "border-[oklch(0.55_0.15_145_/_0.25)] bg-[oklch(0.92_0.12_145_/_0.10)] text-[oklch(0.42_0.13_145)]"
                    : "border-[var(--border)] bg-[var(--background-alt)] text-foreground/70"
                }`}
              >
                {hasCv ? (
                  <BadgeCheck width={14} height={14} strokeWidth={2} />
                ) : (
                  <Page width={14} height={14} strokeWidth={2} />
                )}
                <span className="flex-1">
                  {hasCv
                    ? `${profile.cv?.fileName} sera joint à ta candidature`
                    : "Aucun CV en ligne — tu peux quand même postuler, mais ta visibilité sera limitée"}
                </span>
              </div>

              {/* Cover letter */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] uppercase tracking-[0.08em] font-semibold text-foreground/60">
                  Lettre de motivation{" "}
                  <span className="text-[var(--tertiary-foreground)] normal-case tracking-normal font-normal">
                    · facultatif
                  </span>
                </label>
                <textarea
                  value={coverLetter}
                  onChange={(e) => setCoverLetter(e.target.value)}
                  placeholder={`Pourquoi ce poste, pourquoi ${job.company.name}, ce que tu apportes…`}
                  rows={6}
                  className="bg-white border border-[var(--border)] rounded-xl px-3.5 py-3 text-[13px] outline-none placeholder:text-[var(--tertiary-foreground)] focus:border-[var(--accent)] focus:shadow-[0_0_0_3px_oklch(0.355_0.066_247_/_0.12)] transition-all leading-[1.6] resize-y"
                />
                <p className="text-[10.5px] text-[var(--tertiary-foreground)]">
                  {coverLetter.length} caractères · maximum 2000
                </p>
              </div>
            </div>

            {/* Footer */}
            <div className="px-7 py-4 border-t border-[var(--border)] bg-[var(--background-alt)]/50 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={onClose}
                className="text-[12.5px] text-foreground/65 hover:text-foreground transition-colors"
              >
                Annuler
              </button>
              <button
                type="submit"
                className="h-10 px-5 rounded-xl bg-foreground text-background text-[13px] font-medium hover:bg-foreground/85 transition-colors"
              >
                Envoyer ma candidature
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

function SuccessView({ job, onClose }: { job: Job; onClose: () => void }) {
  return (
    <div className="px-5 sm:px-7 lg:px-9 py-10 text-center">
      <span className="size-14 rounded-2xl bg-[var(--accent)]/10 text-[var(--accent)] inline-flex items-center justify-center">
        <BadgeCheck width={26} height={26} strokeWidth={2} />
      </span>
      <h2 className="font-display text-[24px] tracking-[-0.015em] text-foreground mt-4">
        Candidature envoyee !
      </h2>
      <p className="text-[13.5px] text-muted-foreground mt-2 max-w-sm mx-auto">
        {job.company.name} recoit ton profil. Tu seras notifie par email du
        suivi.
      </p>

      {/* Booster */}
      <div className="mt-5 rounded-xl border border-[var(--accent)]/20 bg-[var(--accent)]/[0.04] p-4 max-w-sm mx-auto text-left">
        <div className="flex items-center gap-2 mb-1.5">
          <Sparks width={14} height={14} strokeWidth={2} className="text-[var(--accent)]" />
          <span className="text-[13px] font-semibold text-foreground">
            Booster ma candidature
          </span>
        </div>
        <p className="text-[12px] text-muted-foreground leading-snug">
          Mettez votre profil en avant aupres de {job.company.name} pour
          3x plus de chances d&apos;etre vu.
        </p>
        <button
          type="button"
          className="mt-2.5 h-8 px-3.5 rounded-full bg-[var(--accent)] text-background text-[12px] font-medium hover:bg-[var(--accent)]/85 transition-colors flex items-center gap-1.5"
        >
          <Sparks width={11} height={11} strokeWidth={2} />
          Booster — 9 EUR
        </button>
      </div>

      <div className="flex items-center justify-center gap-2 mt-6">
        <Link
          href="/candidat/candidatures"
          className="h-10 px-4 rounded-full bg-foreground text-background text-[13px] font-medium hover:bg-foreground/85 transition-colors flex items-center"
        >
          Voir mes candidatures
        </Link>
        <button
          type="button"
          onClick={onClose}
          className="h-10 px-4 rounded-full border border-[var(--border)] bg-white text-[13px] text-foreground/85 hover:bg-[var(--background-alt)] transition-colors flex items-center"
        >
          Continuer
        </button>
      </div>
    </div>
  );
}
