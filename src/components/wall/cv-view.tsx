"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Download,
  Globe,
  Mail,
  MapPin,
  Phone,
} from "iconoir-react";
import { useUser } from "@/lib/auth";
import { useCandidate } from "@/lib/candidate-store";

export function CvView() {
  const user = useUser();
  const router = useRouter();
  const { profile } = useCandidate();

  useEffect(() => {
    if (user === null) {
      const t = window.setTimeout(() => router.replace("/connexion"), 50);
      return () => window.clearTimeout(t);
    }
  }, [user, router]);

  if (!user || user.role !== "candidate") {
    return (
      <div className="max-w-[860px] mx-auto bg-white border border-[var(--border)] rounded-2xl p-12 text-center">
        <p className="font-display italic text-[18px] text-foreground">
          Connecte-toi cote candidat pour voir ton CV.
        </p>
      </div>
    );
  }

  const onPrint = () => {
    if (typeof window !== "undefined") window.print();
  };

  const hasContact = profile.email || profile.phone || profile.location || profile.linkedinUrl || profile.websiteUrl;
  const hasExperiences = profile.experiences.length > 0;
  const hasSkills = profile.skills.length > 0;
  const hasLanguages = profile.languages.length > 0;
  const hasSectors = profile.sectors.length > 0;

  return (
    <div className="max-w-[860px] mx-auto">
      {/* Toolbar */}
      <div className="cv-toolbar flex items-center justify-between gap-3 mb-3 px-1">
        <Link
          href="/candidat/profil"
          className="inline-flex items-center gap-1.5 text-[12.5px] text-foreground/55 hover:text-foreground transition-colors"
        >
          <ArrowLeft width={12} height={12} strokeWidth={2} />
          Retour a mon profil
        </Link>
        <button
          type="button"
          onClick={onPrint}
          className="h-10 px-4 rounded-full bg-foreground text-background text-[13px] font-medium hover:bg-foreground/85 transition-colors flex items-center gap-2"
        >
          <Download width={13} height={13} strokeWidth={2} />
          Telecharger en PDF
        </button>
      </div>

      {/* Document CV — A4 optimise pour impression */}
      <article
        id="cv-document"
        className="cv-document bg-white border border-[var(--border)] rounded-2xl overflow-hidden"
      >
        {/* Header avec bande de couleur */}
        <div
          className="px-8 sm:px-12 lg:px-14 pt-10 pb-8"
          style={{ borderBottom: `3px solid ${user.avatarColor}` }}
        >
          <div className="flex items-start gap-6">
            {profile.avatarDataUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={profile.avatarDataUrl}
                alt={profile.fullName}
                className="size-[100px] rounded-2xl object-cover ring-1 ring-black/5 shrink-0 print:size-[80px]"
              />
            ) : (
              <span
                aria-hidden
                className="inline-flex items-center justify-center size-[100px] rounded-2xl text-white font-display text-[32px] font-medium ring-1 ring-black/5 shrink-0 print:size-[80px]"
                style={{ background: user.avatarColor }}
              >
                {user.initials}
              </span>
            )}
            <div className="min-w-0 flex-1">
              <h1 className="font-display text-[32px] sm:text-[38px] leading-[1.05] tracking-[-0.02em] text-foreground print:text-[28px]">
                {profile.fullName || user.name}
              </h1>
              {profile.headline && (
                <p className="text-[16px] text-foreground/70 mt-1.5 font-display italic print:text-[13px]">
                  {profile.headline}
                </p>
              )}

              {/* Contact row */}
              {hasContact && (
                <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5 mt-4 text-[12px] text-foreground/60 print:text-[10px] print:gap-x-3">
                  {profile.email && (
                    <span className="inline-flex items-center gap-1.5">
                      <Mail width={11} height={11} strokeWidth={2} />
                      {profile.email}
                    </span>
                  )}
                  {profile.phone && (
                    <span className="inline-flex items-center gap-1.5">
                      <Phone width={11} height={11} strokeWidth={2} />
                      {profile.phone}
                    </span>
                  )}
                  {profile.location && (
                    <span className="inline-flex items-center gap-1.5">
                      <MapPin width={11} height={11} strokeWidth={2} />
                      {profile.location}
                    </span>
                  )}
                  {profile.linkedinUrl && (
                    <span className="inline-flex items-center gap-1.5">
                      <Globe width={11} height={11} strokeWidth={2} />
                      {profile.linkedinUrl}
                    </span>
                  )}
                  {profile.websiteUrl && (
                    <span className="inline-flex items-center gap-1.5">
                      <Globe width={11} height={11} strokeWidth={2} />
                      {profile.websiteUrl}
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Body — 2 colonnes sur desktop/print */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] print:grid-cols-[1fr_220px]">
          {/* Colonne principale */}
          <div className="px-8 sm:px-12 lg:px-14 py-8 print:px-8 print:py-6">
            {/* Bio */}
            {profile.bio && (
              <Section title="Profil" color={user.avatarColor}>
                <p className="text-[13.5px] leading-[1.75] text-foreground/85 whitespace-pre-line print:text-[11px] print:leading-[1.6]">
                  {profile.bio}
                </p>
              </Section>
            )}

            {/* Experiences */}
            {hasExperiences && (
              <Section title="Experiences professionnelles" color={user.avatarColor}>
                <ol className="flex flex-col gap-5 print:gap-3">
                  {profile.experiences.map((exp) => (
                    <li key={exp.id} className="break-inside-avoid">
                      <div className="flex items-baseline justify-between gap-3">
                        <h3 className="text-[15px] font-semibold text-foreground leading-tight print:text-[12px]">
                          {exp.title}
                        </h3>
                        <span className="text-[11px] font-mono text-foreground/50 tabular-nums shrink-0 print:text-[9px]">
                          {exp.startYear} — {exp.current ? "present" : (exp.endYear ?? "")}
                        </span>
                      </div>
                      <p className="text-[13px] text-foreground/60 mt-0.5 print:text-[10.5px]">
                        {exp.company}
                        {exp.location ? ` · ${exp.location}` : ""}
                      </p>
                      {exp.description && (
                        <p className="text-[12.5px] text-foreground/75 leading-[1.6] mt-2 print:text-[10px]">
                          {exp.description}
                        </p>
                      )}
                    </li>
                  ))}
                </ol>
              </Section>
            )}
          </div>

          {/* Sidebar droite */}
          <div className="px-6 py-8 bg-[#f8f8f7] border-l border-[var(--border)] print:px-5 print:py-6 print:bg-[#f5f5f4]">
            {/* Competences */}
            {hasSkills && (
              <SideSection title="Competences">
                <div className="flex flex-col gap-1.5">
                  {profile.skills.map((s) => (
                    <div
                      key={s}
                      className="text-[12px] text-foreground/85 py-1 border-b border-[var(--border)] last:border-b-0 print:text-[10px]"
                    >
                      {s}
                    </div>
                  ))}
                </div>
              </SideSection>
            )}

            {/* Langues */}
            {hasLanguages && (
              <SideSection title="Langues">
                <div className="flex flex-col gap-1.5">
                  {profile.languages.map((l) => (
                    <div
                      key={l}
                      className="text-[12px] text-foreground/85 py-1 border-b border-[var(--border)] last:border-b-0 print:text-[10px]"
                    >
                      {l}
                    </div>
                  ))}
                </div>
              </SideSection>
            )}

            {/* Secteurs */}
            {hasSectors && (
              <SideSection title="Secteurs vises">
                <div className="flex flex-col gap-1.5">
                  {profile.sectors.map((s) => (
                    <div
                      key={s}
                      className="text-[12px] text-foreground/85 py-1 border-b border-[var(--border)] last:border-b-0 print:text-[10px]"
                    >
                      {s}
                    </div>
                  ))}
                </div>
              </SideSection>
            )}

            {/* Experience */}
            {profile.experienceYears !== undefined && (
              <SideSection title="Experience">
                <p className="text-[12px] text-foreground/85 print:text-[10px]">
                  {profile.experienceYears} an{profile.experienceYears > 1 ? "s" : ""}
                </p>
              </SideSection>
            )}
          </div>
        </div>

        {/* Footer */}
        <footer className="px-8 sm:px-12 lg:px-14 py-4 border-t border-[var(--border)] flex items-center justify-between text-[9px] text-foreground/35 font-mono tracking-wider print:px-8 print:py-3">
          <span>MONTE CARLO WORK</span>
          <span>{new Date().toLocaleDateString("fr-FR")}</span>
        </footer>
      </article>
    </div>
  );
}

function Section({
  title,
  color,
  children,
}: {
  title: string;
  color: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mt-8 first:mt-0 break-inside-avoid">
      <h2 className="text-[11px] uppercase tracking-[0.12em] font-semibold mb-3 print:text-[9px]" style={{ color }}>
        {title}
      </h2>
      {children}
    </section>
  );
}

function SideSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mt-6 first:mt-0 break-inside-avoid">
      <h2 className="text-[10px] uppercase tracking-[0.12em] font-semibold text-foreground/50 mb-2.5 print:text-[8.5px]">
        {title}
      </h2>
      {children}
    </section>
  );
}
