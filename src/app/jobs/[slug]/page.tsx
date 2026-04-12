import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  ArrowUpRight,
  Bag,
  Building,
  Calendar,
  Check,
  Clock,
  EuroSquare,
  Globe,
  MapPin,
  Sparks,
  Translate,
  UserCircle,
} from "iconoir-react";
import {
  type Job,
  companyBarColor,
  daysSincePosted,
  formatSalary,
  relativeDate,
} from "@/lib/data";
import { fetchAllJobs, fetchJobBySlug } from "@/lib/supabase/queries";
import { CompanyLogo } from "@/components/wall/company-logo";
import { Shell } from "@/components/wall/shell";
import { ApplyButton } from "@/components/wall/apply-button";
import { SaveShareButtons } from "@/components/wall/save-share-buttons";
import { MatchPill } from "@/components/wall/match-pill";

const SITE_URL = "https://mur.mc";

export const revalidate = 300;

export async function generateMetadata(
  props: PageProps<"/jobs/[slug]">,
): Promise<Metadata> {
  const { slug } = await props.params;
  const job = await fetchJobBySlug(slug);
  if (!job) {
    return { title: "Offre introuvable" };
  }
  const title = `${job.title} — ${job.company.name}`;
  const description =
    job.shortDescription.length > 0
      ? job.shortDescription
      : `${job.title} chez ${job.company.name} à ${job.location}. ${job.type} · ${job.sector}.`;
  const url = `${SITE_URL}/jobs/${job.slug}`;
  return {
    title,
    description,
    alternates: { canonical: `/jobs/${job.slug}` },
    openGraph: {
      type: "article",
      url,
      title,
      description,
      siteName: "Mur.mc",
      locale: job.lang === "en" ? "en_US" : "fr_MC",
      publishedTime: job.postedAt,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
    robots: { index: true, follow: true },
  };
}

function jobJsonLd(job: Job | null) {
  if (!job) return null;
  const employmentType =
    {
      CDI: "FULL_TIME",
      CDD: "TEMPORARY",
      Freelance: "CONTRACTOR",
      Stage: "INTERN",
      Alternance: "OTHER",
      Saison: "TEMPORARY",
    }[job.type] || "FULL_TIME";

  const baseSalary =
    job.salaryMin || job.salaryMax
      ? {
          "@type": "MonetaryAmount",
          currency: "EUR",
          value: {
            "@type": "QuantitativeValue",
            minValue: job.salaryMin,
            maxValue: job.salaryMax,
            unitText: "YEAR",
          },
        }
      : undefined;

  return {
    "@context": "https://schema.org/",
    "@type": "JobPosting",
    title: job.title,
    description: job.description || job.shortDescription,
    datePosted: job.postedAt,
    employmentType,
    hiringOrganization: {
      "@type": "Organization",
      name: job.company.name,
      sameAs: job.company.website
        ? `https://${job.company.website}`
        : undefined,
    },
    jobLocation: {
      "@type": "Place",
      address: {
        "@type": "PostalAddress",
        addressLocality: job.location,
        addressCountry: "MC",
      },
      geo: {
        "@type": "GeoCoordinates",
        latitude: job.lat,
        longitude: job.lng,
      },
    },
    inLanguage: job.lang,
    industry: job.sector,
    baseSalary,
    directApply: true,
    url: `${SITE_URL}/jobs/${job.slug}`,
    identifier: {
      "@type": "PropertyValue",
      name: "Mur.mc",
      value: job.id,
    },
  };
}

export default async function JobPage(props: PageProps<"/jobs/[slug]">) {
  const { slug } = await props.params;
  const job = await fetchJobBySlug(slug);
  if (!job) notFound();

  const bar = companyBarColor(job.company.id);
  const salary = formatSalary(job);
  const ld = jobJsonLd(job);
  // Offres similaires : meme secteur, exclure l'offre courante
  const allJobs = await fetchAllJobs();
  const related = allJobs
    .filter((j) => j.id !== job.id && j.sector === job.sector)
    .slice(0, 3);
  const fresh = daysSincePosted(job.postedAt) <= 1;

  return (
    <Shell jobs={allJobs}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(ld) }}
      />

      <div className="max-w-[1100px] mx-auto">
        {/* Breadcrumb */}
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-[12.5px] text-foreground/55 hover:text-foreground transition-colors mb-3 px-1"
        >
          <ArrowLeft width={12} height={12} strokeWidth={2} />
          Retour au mur
        </Link>

        {/* Hero card */}
        <header
          className="relative bg-white border border-[var(--border)] rounded-2xl px-5 sm:px-7 lg:px-9 py-6 lg:py-8 overflow-hidden"
          style={{
            background: `linear-gradient(180deg, ${job.company.logoColor}0F 0%, #ffffff 70%)`,
          }}
        >
          <span
            className="absolute top-0 left-9 right-9 h-[3px] rounded-b-[4px]"
            style={{ background: bar }}
          />

          <div className="flex items-start gap-3 sm:gap-5">
            <CompanyLogo
              name={job.company.name}
              domain={job.company.domain}
              color={job.company.logoColor}
              initials={job.company.initials}
              size={56}
              radius={16}
            />
            <div className="min-w-0 flex-1 pt-1">
              <Link
                href={`/entreprises/${job.company.slug}`}
                className="ed-label-sm hover:text-foreground transition-colors inline-flex items-center gap-1"
              >
                {job.company.name}
                <ArrowUpRight width={10} height={10} strokeWidth={2.4} />
              </Link>

              <h1 className="font-display text-[26px] sm:text-[30px] lg:text-[36px] leading-[1.08] tracking-[-0.015em] text-foreground mt-1.5">
                {job.title}
              </h1>

              <div className="flex flex-wrap items-center gap-1.5 mt-4">
                <span
                  className="wall-badge"
                  data-tone="bar"
                  style={{ "--bar-color": bar } as React.CSSProperties}
                >
                  <Bag /> {job.type}
                </span>
                <span className="wall-badge" data-tone="muted">
                  <Building /> {job.sector}
                </span>
                <span className="wall-badge" data-tone="muted">
                  <MapPin /> {job.location}
                </span>
                <span className="wall-badge" data-tone="muted">
                  <Clock /> {job.workTime}
                </span>
                {fresh && (
                  <span className="wall-badge" data-tone="fresh">
                    Nouveau
                  </span>
                )}
                {job.featured && (
                  <span className="wall-badge" data-tone="accent">
                    <Sparks /> À la une
                  </span>
                )}
                <MatchPill job={job} size="md" />
              </div>
            </div>
          </div>
        </header>

        {/* Body : 2 colonnes */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 mt-3 items-start">
          {/* Colonne principale */}
          <article className="lg:col-span-2 bg-white border border-[var(--border)] rounded-2xl px-5 sm:px-7 lg:px-9 py-6 lg:py-9">
            {/* Lead */}
            <p className="font-display text-[18px] leading-[1.55] text-foreground/90 italic">
              {job.shortDescription}
            </p>

            {job.description && job.description !== job.shortDescription && (
              <p className="text-[14.5px] leading-[1.75] text-foreground/85 mt-5">
                {job.description}
              </p>
            )}

            <Section title="Responsabilités" items={job.responsibilities} icon={Check} />
            <Section title="Profil recherché" items={job.requirements} icon={UserCircle} />
            <Section title="Avantages" items={job.benefits} icon={Sparks} />

            {/* À propos de l'entreprise */}
            <div className="mt-12 pt-8 border-t border-[var(--border)]">
              <p className="ed-label-sm mb-3">À propos de l&apos;entreprise</p>
              <div className="flex items-start gap-4">
                <CompanyLogo
                  name={job.company.name}
                  domain={job.company.domain}
                  color={job.company.logoColor}
                  initials={job.company.initials}
                  size={44}
                  radius={14}
                />
                <div className="min-w-0 flex-1">
                  <h3 className="font-display text-[18px] leading-tight tracking-[-0.005em]">
                    {job.company.name}
                  </h3>
                  <p className="text-[13.5px] text-muted-foreground leading-[1.65] mt-2">
                    {job.company.description}
                  </p>
                  <Link
                    href={`/entreprises/${job.company.slug}`}
                    className="inline-flex items-center gap-1.5 mt-3 text-[12.5px] text-[var(--accent)] hover:underline underline-offset-2"
                  >
                    Voir tous leurs postes
                    <ArrowUpRight width={11} height={11} strokeWidth={2.2} />
                  </Link>
                </div>
              </div>
            </div>
          </article>

          {/* Sidebar droite */}
          <aside className="lg:sticky lg:top-[80px] flex flex-col gap-3">
            {/* Apply card */}
            <div className="bg-white border border-[var(--border)] rounded-2xl p-5">
              <ApplyButton job={job} />
              <SaveShareButtons
                jobId={job.id}
                jobUrl={`/jobs/${job.slug}`}
                jobTitle={job.title}
              />
              <p className="text-[10.5px] font-mono text-[var(--tertiary-foreground)] mt-3 text-center tracking-wider">
                RÉF · {job.id.toUpperCase()}
              </p>
            </div>

            {/* Détails */}
            <div className="bg-white border border-[var(--border)] rounded-2xl p-5">
              <p className="ed-label-sm mb-3">Détails</p>
              <dl className="flex flex-col gap-2.5">
                <Detail icon={Bag} label="Contrat" value={job.type} />
                <Detail icon={Building} label="Secteur" value={job.sector} />
                <Detail icon={MapPin} label="Lieu" value={job.location} />
                <Detail icon={Clock} label="Temps" value={job.workTime} />
                {salary && (
                  <Detail icon={EuroSquare} label="Salaire" value={salary} />
                )}
                <Detail
                  icon={Translate}
                  label="Langues"
                  value={job.languages.join(" · ")}
                />
                <Detail
                  icon={Calendar}
                  label="Publié"
                  value={relativeDate(job.postedAt)}
                />
                {job.company.website && (
                  <Detail
                    icon={Globe}
                    label="Site"
                    value={
                      <a
                        href={`https://${job.company.website}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[var(--accent)] hover:underline underline-offset-2"
                      >
                        {job.company.website}
                      </a>
                    }
                  />
                )}
              </dl>
            </div>

            {/* Postes similaires */}
            {related.length > 0 && (
              <div className="bg-white border border-[var(--border)] rounded-2xl p-5">
                <p className="ed-label-sm mb-3">Postes similaires</p>
                <ul className="flex flex-col">
                  {related.map((j) => (
                    <li key={j.id}>
                      <Link
                        href={`/jobs/${j.slug}`}
                        className="group flex items-start gap-3 py-2.5 -mx-2 px-2 rounded-lg hover:bg-[var(--background-alt)] transition-colors"
                      >
                        <CompanyLogo
                          name={j.company.name}
                          domain={j.company.domain}
                          color={j.company.logoColor}
                          initials={j.company.initials}
                          size={32}
                          radius={10}
                        />
                        <div className="min-w-0 flex-1">
                          <div className="text-[13px] font-medium text-foreground line-clamp-2 leading-tight group-hover:text-[var(--accent)] transition-colors">
                            {j.title}
                          </div>
                          <div className="text-[11.5px] text-muted-foreground mt-0.5 truncate">
                            {j.company.name} · {j.type}
                          </div>
                        </div>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </aside>
        </div>
      </div>
    </Shell>
  );
}

function Section({
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
    <section className="mt-10">
      <h2 className="ed-label-sm mb-4">{title}</h2>
      <ul className="flex flex-col gap-2.5">
        {items.map((it, i) => (
          <li key={i} className="flex items-start gap-2.5">
            <span className="mt-[3px] size-[18px] rounded-md bg-[var(--accent)]/10 text-[var(--accent)] flex items-center justify-center shrink-0">
              <Icon width={11} height={11} strokeWidth={2.4} />
            </span>
            <span className="text-[14px] text-foreground/85 leading-[1.6]">
              {it}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}

function Detail({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  label: string;
  value: React.ReactNode;
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
        <dd className="text-foreground text-right truncate">{value}</dd>
      </div>
    </div>
  );
}
