"use client";

import { useEffect } from "react";
import {
  Calendar,
  Globe,
  Hashtag,
  Language as LanguageIcon,
  Mail,
  MapPin,
  PageStar,
  Phone,
  Suitcase,
  Xmark,
} from "iconoir-react";
import type {
  EmployerApplication,
  EmployerCandidate,
} from "@/lib/employer-store";
import { StarRating } from "./star-rating";

type Props = {
  app: EmployerApplication;
  candidate: EmployerCandidate;
  open: boolean;
  onClose: () => void;
};

/**
 * Modale d'aperçu rapide du CV d'un candidat — ouverte depuis le kanban
 * ou la fiche candidat via l'icône oeil. Pas de téléchargement, juste
 * un coup d'oeil complet au profil sans naviguer.
 */
export function CvPreviewModal({ app, candidate, open, onClose }: Props) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-foreground/20 backdrop-blur-[3px] flex items-start justify-center pt-[4vh] px-3 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="w-full max-w-[640px] bg-white rounded-2xl border border-[var(--border)] shadow-[0_24px_60px_rgba(10,10,10,0.22)] overflow-hidden mb-8"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 z-10 bg-white/95 backdrop-blur-md border-b border-[var(--border)] px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3 min-w-0">
            <span
              className="size-10 rounded-xl flex items-center justify-center text-white font-display text-[13px] font-medium ring-1 ring-black/5 shrink-0"
              style={{
                background: `linear-gradient(155deg, ${candidate.avatarColor}, #122a3f)`,
              }}
              aria-hidden
            >
              {candidate.initials}
            </span>
            <div className="min-w-0">
              <div className="text-[15px] font-medium text-foreground truncate">
                {candidate.fullName}
              </div>
              {candidate.headline && (
                <div className="text-[12px] text-muted-foreground truncate">
                  {candidate.headline}
                </div>
              )}
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
        <div className="px-6 py-6 flex flex-col gap-6">
          {/* Contact row */}
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[12.5px] text-foreground/65">
            {candidate.email && (
              <a
                href={`mailto:${candidate.email}`}
                className="inline-flex items-center gap-1.5 hover:text-[var(--accent)] transition-colors"
              >
                <Mail width={11} height={11} strokeWidth={2} />
                {candidate.email}
              </a>
            )}
            {candidate.phone && (
              <a
                href={`tel:${candidate.phone.replace(/\s/g, "")}`}
                className="inline-flex items-center gap-1.5 hover:text-[var(--accent)] transition-colors"
              >
                <Phone width={11} height={11} strokeWidth={2} />
                {candidate.phone}
              </a>
            )}
            {candidate.location && (
              <span className="inline-flex items-center gap-1.5">
                <MapPin width={11} height={11} strokeWidth={2} />
                {candidate.location}
              </span>
            )}
            {candidate.linkedinUrl && (
              <a
                href={`https://${candidate.linkedinUrl}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-[var(--accent)] hover:underline underline-offset-2"
              >
                <Globe width={11} height={11} strokeWidth={2} />
                LinkedIn
              </a>
            )}
          </div>

          {/* Match + rating */}
          <div className="flex items-center gap-4">
            {app.matchScore >= 50 && (
              <span className="wall-badge" data-tone="accent">
                {app.matchScore}% match
              </span>
            )}
            <StarRating value={app.rating} size={14} />
            {candidate.experienceYears && (
              <span className="wall-badge" data-tone="muted">
                <Suitcase /> {candidate.experienceYears} ans
              </span>
            )}
          </div>

          {/* Bio */}
          {candidate.bio && (
            <Section title="À propos">
              <p className="text-[13.5px] leading-[1.7] text-foreground/85">
                {candidate.bio}
              </p>
            </Section>
          )}

          {/* Skills */}
          {candidate.skills.length > 0 && (
            <Section title="Compétences" icon={Hashtag}>
              <div className="flex flex-wrap gap-1.5">
                {candidate.skills.map((s) => (
                  <span key={s} className="wall-badge" data-tone="muted">
                    {s}
                  </span>
                ))}
              </div>
            </Section>
          )}

          {/* Langues */}
          {candidate.languages.length > 0 && (
            <Section title="Langues" icon={LanguageIcon}>
              <div className="flex flex-wrap gap-1.5">
                {candidate.languages.map((l) => (
                  <span
                    key={l}
                    className="h-7 px-2.5 rounded-full text-[11.5px] border border-[var(--border)] bg-white text-foreground/75"
                  >
                    {l}
                  </span>
                ))}
              </div>
            </Section>
          )}

          {/* CV fichier */}
          {candidate.cvFileName && (
            <Section title="CV" icon={PageStar}>
              <div className="flex items-center gap-3 rounded-xl bg-[var(--background-alt)] border border-[var(--border)] p-3">
                <span className="size-9 rounded-lg bg-white border border-[var(--border)] flex items-center justify-center text-foreground/55 shrink-0">
                  <PageStar width={14} height={14} strokeWidth={2} />
                </span>
                <span className="text-[13px] font-medium text-foreground truncate">
                  {candidate.cvFileName}
                </span>
              </div>
            </Section>
          )}

          {/* Cover letter */}
          {app.coverLetter && (
            <Section title="Lettre de motivation">
              <p className="text-[13px] leading-[1.7] text-foreground/85 italic font-display whitespace-pre-line rounded-xl bg-[var(--background-alt)] border border-[var(--border)] p-4">
                « {app.coverLetter} »
              </p>
            </Section>
          )}

          {/* Date candidature */}
          <div className="pt-4 border-t border-[var(--border)] flex items-center gap-3 text-[11.5px] text-[var(--tertiary-foreground)]">
            <Calendar width={11} height={11} strokeWidth={2} />
            <span>
              Candidature reçue le{" "}
              {new Date(app.appliedAt).toLocaleDateString("fr-FR", {
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

function Section({
  title,
  icon: Icon,
  children,
}: {
  title: string;
  icon?: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="flex items-center gap-1.5 mb-2">
        {Icon && (
          <Icon
            width={11}
            height={11}
            strokeWidth={2}
            className="text-foreground/55"
          />
        )}
        <h3 className="text-[10.5px] uppercase tracking-[0.09em] font-semibold text-foreground/55">
          {title}
        </h3>
      </div>
      {children}
    </div>
  );
}
