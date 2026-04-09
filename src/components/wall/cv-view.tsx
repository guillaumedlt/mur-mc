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
          Connecte-toi côté candidat pour voir ton CV.
        </p>
      </div>
    );
  }

  const onPrint = () => {
    if (typeof window !== "undefined") window.print();
  };

  return (
    <div className="max-w-[860px] mx-auto">
      {/* Toolbar (cachée à l'impression) */}
      <div className="cv-toolbar flex items-center justify-between gap-3 mb-3 px-1">
        <Link
          href="/candidat/profil"
          className="inline-flex items-center gap-1.5 text-[12.5px] text-foreground/55 hover:text-foreground transition-colors"
        >
          <ArrowLeft width={12} height={12} strokeWidth={2} />
          Retour à mon profil
        </Link>
        <button
          type="button"
          onClick={onPrint}
          className="h-10 px-4 rounded-full bg-foreground text-background text-[13px] font-medium hover:bg-foreground/85 transition-colors flex items-center gap-2"
        >
          <Download width={13} height={13} strokeWidth={2} />
          Télécharger en PDF
        </button>
      </div>

      {/* Document CV */}
      <article
        id="cv-document"
        className="cv-document bg-white border border-[var(--border)] rounded-2xl px-8 sm:px-12 lg:px-14 py-10 sm:py-12 lg:py-14"
      >
        {/* Hero CV */}
        <header className="flex items-start gap-6 pb-8 border-b border-[var(--border)]">
          {profile.avatarDataUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={profile.avatarDataUrl}
              alt={profile.fullName}
              className="size-[110px] rounded-2xl object-cover ring-1 ring-black/5 shrink-0"
            />
          ) : (
            <span
              aria-hidden
              className="inline-flex items-center justify-center size-[110px] rounded-2xl text-white font-display text-[34px] font-medium ring-1 ring-black/5 shrink-0"
              style={{ background: user.avatarColor }}
            >
              {user.initials}
            </span>
          )}
          <div className="min-w-0 flex-1">
            <h1 className="font-display text-[34px] sm:text-[40px] leading-[1.05] tracking-[-0.015em] text-foreground">
              {profile.fullName || user.name}
            </h1>
            {profile.headline && (
              <p className="text-[16px] text-foreground/75 mt-2 font-display italic">
                {profile.headline}
              </p>
            )}
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 mt-4 text-[12.5px] text-foreground/65">
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
          </div>
        </header>

        {/* Bio */}
        {profile.bio && (
          <Section title="À propos">
            <p className="text-[14px] leading-[1.7] text-foreground/85">
              {profile.bio}
            </p>
          </Section>
        )}

        {/* Expériences */}
        {profile.experiences.length > 0 && (
          <Section title="Expériences professionnelles">
            <ol className="flex flex-col gap-5">
              {profile.experiences.map((exp) => (
                <li
                  key={exp.id}
                  className="grid grid-cols-1 sm:grid-cols-[180px_1fr] gap-2 sm:gap-6"
                >
                  <div className="text-[12px] font-mono text-foreground/55 tabular-nums sm:pt-0.5">
                    {exp.startYear} —{" "}
                    {exp.current ? "présent" : (exp.endYear ?? "")}
                  </div>
                  <div>
                    <h3 className="text-[15px] font-medium text-foreground leading-tight">
                      {exp.title}
                    </h3>
                    <p className="text-[13px] text-foreground/65 mt-0.5">
                      {exp.company}
                      {exp.location ? ` · ${exp.location}` : ""}
                    </p>
                    {exp.description && (
                      <p className="text-[13px] text-foreground/80 leading-[1.65] mt-2">
                        {exp.description}
                      </p>
                    )}
                  </div>
                </li>
              ))}
            </ol>
          </Section>
        )}

        {/* Compétences */}
        {profile.skills.length > 0 && (
          <Section title="Compétences">
            <div className="flex flex-wrap gap-1.5">
              {profile.skills.map((s) => (
                <span
                  key={s}
                  className="inline-flex items-center h-7 px-2.5 rounded-full bg-[var(--background-alt)] border border-[var(--border)] text-[11.5px] text-foreground"
                >
                  {s}
                </span>
              ))}
            </div>
          </Section>
        )}

        {/* Langues */}
        {profile.languages.length > 0 && (
          <Section title="Langues">
            <div className="flex flex-wrap gap-1.5">
              {profile.languages.map((l) => (
                <span
                  key={l}
                  className="inline-flex items-center h-7 px-2.5 rounded-full bg-white border border-[var(--border)] text-[11.5px] text-foreground"
                >
                  {l}
                </span>
              ))}
            </div>
          </Section>
        )}

        {/* Secteurs */}
        {profile.sectors.length > 0 && (
          <Section title="Secteurs visés">
            <div className="flex flex-wrap gap-1.5">
              {profile.sectors.map((s) => (
                <span
                  key={s}
                  className="inline-flex items-center h-7 px-2.5 rounded-full bg-white border border-[var(--border)] text-[11.5px] text-foreground"
                >
                  {s}
                </span>
              ))}
            </div>
          </Section>
        )}

        {/* Footer */}
        <footer className="mt-12 pt-6 border-t border-[var(--border)] flex items-center justify-between text-[10.5px] text-[var(--tertiary-foreground)] font-mono tracking-wider">
          <span>CV GÉNÉRÉ DEPUIS MUR.MC</span>
          <span>{new Date().toLocaleDateString("fr-FR")}</span>
        </footer>
      </article>
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mt-8">
      <h2 className="text-[10.5px] uppercase tracking-[0.12em] font-semibold text-[var(--accent)] mb-3">
        {title}
      </h2>
      {children}
    </section>
  );
}
