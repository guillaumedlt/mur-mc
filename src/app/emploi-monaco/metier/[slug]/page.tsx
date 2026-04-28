import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Bag, MapPin, Sparks } from "iconoir-react";
import { Shell } from "@/components/wall/shell";
import { JobCard } from "@/components/wall/job-card";
import { fetchAllJobs } from "@/lib/supabase/queries";
import { matchJobsByKeywords } from "@/lib/seo/match-jobs";
import { METIERS } from "../metiers";
import { CROSS_PAGES } from "../cross";
import { JobAlertForm } from "@/components/wall/job-alert-form";

const SITE_URL = "https://montecarlowork.com";

export const revalidate = 300;

export async function generateMetadata(
  props: { params: Promise<{ slug: string }> },
): Promise<Metadata> {
  const { slug } = await props.params;

  // Cross page (metier × secteur) ?
  const cross = CROSS_PAGES.find((c) => c.slug === slug);
  if (cross) {
    const jobs = await fetchAllJobs();
    const count = matchJobsByKeywords(jobs, cross.metier.match).filter((j) => j.sector === cross.sectorFilter).length;
    const title = `Emploi ${cross.metier.label} ${cross.sectorLabel} a Monaco — ${count} offre${count > 1 ? "s" : ""} | Monte Carlo Work`;
    return {
      title,
      description: `${cross.metier.description} Secteur ${cross.sectorLabel} a Monaco. ${count} offre${count > 1 ? "s" : ""} en direct.`,
      alternates: { canonical: `/emploi-monaco/metier/${slug}` },
      openGraph: { type: "website", url: `${SITE_URL}/emploi-monaco/metier/${slug}`, title, siteName: "Monte Carlo Work" },
    };
  }

  const metier = METIERS.find((m) => m.slug === slug);
  if (!metier) return { title: "Metier introuvable", robots: { index: false } };

  const jobs = await fetchAllJobs();
  const count = matchJobsByKeywords(jobs, metier.match).length;

  const title = `Emploi ${metier.label} a Monaco — ${count} offre${count > 1 ? "s" : ""} | Monte Carlo Work`;
  const description = `${metier.description} ${count} offre${count > 1 ? "s" : ""} disponible${count > 1 ? "s" : ""} en ce moment. Postulez en direct sur Monte Carlo Work.`;

  return {
    title,
    description,
    keywords: [
      `emploi ${metier.label.toLowerCase()} monaco`,
      `offre ${metier.label.toLowerCase()} monaco`,
      `${metier.label.toLowerCase()} monaco`,
      `job ${metier.label.toLowerCase()} monaco`,
      `recrutement ${metier.label.toLowerCase()} monaco`,
    ],
    alternates: { canonical: `/emploi-monaco/metier/${slug}` },
    openGraph: {
      type: "website",
      url: `${SITE_URL}/emploi-monaco/metier/${slug}`,
      title: `Emploi ${metier.label} a Monaco (${count} offres)`,
      description: metier.description,
      siteName: "Monte Carlo Work",
      locale: "fr_MC",
    },
    twitter: { card: "summary_large_image", title, description },
  };
}

export default async function MetierPage(
  props: { params: Promise<{ slug: string }> },
) {
  const { slug } = await props.params;

  // Cross page : reutilise la meme UI mais filtre aussi par secteur
  const cross = CROSS_PAGES.find((c) => c.slug === slug);
  const metier = cross?.metier ?? METIERS.find((m) => m.slug === slug);
  if (!metier) notFound();
  const sectorFilter = cross?.sectorFilter ?? null;

  const allJobs = await fetchAllJobs();
  const metierJobsAll = matchJobsByKeywords(allJobs, metier.match);
  const metierJobs = sectorFilter
    ? metierJobsAll.filter((j) => j.sector === sectorFilter)
    : metierJobsAll;

  // Related metiers = meme sector, sauf celui-ci
  const related = METIERS.filter(
    (m) => m.sector === metier.sector && m.slug !== slug,
  ).slice(0, 6);

  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "WebPage",
      name: `Emploi ${metier.label} a Monaco`,
      description: metier.description,
      url: `${SITE_URL}/emploi-monaco/metier/${slug}`,
      breadcrumb: {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Monte Carlo Work", item: SITE_URL },
          { "@type": "ListItem", position: 2, name: "Emploi a Monaco", item: `${SITE_URL}/emploi-monaco` },
          { "@type": "ListItem", position: 3, name: `Emploi ${metier.label}`, item: `${SITE_URL}/emploi-monaco/metier/${slug}` },
        ],
      },
    },
    {
      "@context": "https://schema.org",
      "@type": "ItemList",
      name: `Offres ${metier.label} a Monaco`,
      numberOfItems: metierJobs.length,
      itemListElement: metierJobs.slice(0, 10).map((j, i) => ({
        "@type": "ListItem",
        position: i + 1,
        url: `${SITE_URL}/jobs/${j.slug}`,
        name: j.title,
      })),
    },
  ];

  return (
    <Shell jobs={allJobs}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div className="max-w-[1100px] mx-auto">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-1.5 text-[12px] text-foreground/50 mb-3 px-1">
          <Link href="/emploi-monaco" className="hover:text-foreground transition-colors">
            <ArrowLeft width={11} height={11} strokeWidth={2} className="inline mr-1" />
            Emploi Monaco
          </Link>
          <span>/</span>
          <Link href="/emploi-monaco/metier" className="hover:text-foreground transition-colors">
            Metiers
          </Link>
          <span>/</span>
          <span className="text-foreground/70">{metier.label}</span>
        </nav>

        {/* Hero */}
        <header className="bg-white border border-[var(--border)] rounded-2xl px-5 sm:px-7 lg:px-9 py-8 lg:py-10 mb-3">
          <p className="ed-label-sm text-[var(--accent)]">Emploi {metier.label}</p>
          <h1 className="font-display text-[28px] sm:text-[34px] lg:text-[38px] leading-[1.08] tracking-[-0.02em] text-foreground mt-2">
            Emploi {metier.label}{cross ? ` ${cross.sectorLabel}` : ""} a Monaco
          </h1>
          <p className="text-[14.5px] text-muted-foreground mt-3 max-w-2xl leading-[1.7]">
            {metier.description}
          </p>
          <div className="flex flex-wrap items-center gap-2 mt-5">
            <span className="wall-badge" data-tone="accent">
              <Bag width={11} height={11} strokeWidth={2} />
              {metierJobs.length} offre{metierJobs.length > 1 ? "s" : ""} disponible{metierJobs.length > 1 ? "s" : ""}
            </span>
            <span className="wall-badge" data-tone="muted">
              <MapPin width={11} height={11} strokeWidth={2} /> Monaco
            </span>
          </div>
        </header>

        {/* Job listings */}
        <section className="bg-white border border-[var(--border)] rounded-2xl px-5 sm:px-7 lg:px-9 py-6 lg:py-8 mb-3">
          <h2 className="font-display text-[20px] tracking-[-0.01em] text-foreground mb-5">
            {metierJobs.length > 0
              ? `${metierJobs.length} offre${metierJobs.length > 1 ? "s" : ""} de ${metier.label} a Monaco`
              : `Aucune offre de ${metier.label} pour le moment`}
          </h2>
          {metierJobs.length === 0 ? (
            <div>
              <p className="text-[13.5px] text-muted-foreground italic font-display mb-4">
                Pas d&apos;offre correspondante en ce moment. Creez une alerte ou consultez les offres proches.
              </p>
              <Link
                href="/emploi-monaco"
                className="inline-flex h-10 px-5 rounded-full bg-foreground text-background text-[13px] font-medium items-center"
              >
                Toutes les offres Monaco
              </Link>
            </div>
          ) : (
            <div className="wall-grid" data-density="standard">
              {metierJobs.map((j, i) => (
                <JobCard key={j.id} job={j} index={i} />
              ))}
            </div>
          )}
        </section>

        {/* Metiers proches */}
        {related.length > 0 && (
          <section className="bg-white border border-[var(--border)] rounded-2xl px-5 sm:px-7 lg:px-9 py-6 lg:py-8 mb-3">
            <h2 className="font-display text-[20px] tracking-[-0.01em] text-foreground mb-4">
              Metiers proches a Monaco
            </h2>
            <div className="flex flex-wrap gap-2">
              {related.map((r) => {
                const rCount = matchJobsByKeywords(allJobs, r.match).length;
                return (
                  <Link
                    key={r.slug}
                    href={`/emploi-monaco/metier/${r.slug}`}
                    className="inline-flex items-center gap-2 h-9 px-4 rounded-full border border-[var(--border)] bg-white text-[12.5px] text-foreground/80 hover:border-[var(--accent)]/40 hover:text-[var(--accent)] transition-colors"
                  >
                    {r.label}
                    <span className="text-[10.5px] font-mono text-foreground/45">{rCount}</span>
                  </Link>
                );
              })}
            </div>
          </section>
        )}

        {/* Editorial : salaire + conseil */}
        {(metier.salaryRange || metier.tip) && (
          <section className="bg-white border border-[var(--border)] rounded-2xl px-5 sm:px-7 lg:px-9 py-6 lg:py-8 mb-3">
            <h2 className="font-display text-[20px] tracking-[-0.01em] text-foreground mb-4">
              Salaire & conseils — {metier.label} a Monaco
            </h2>
            {metier.salaryRange && (
              <div className="flex items-center gap-3 mb-4">
                <span className="inline-flex items-center gap-1.5 h-9 px-4 rounded-full bg-[var(--accent)]/10 text-[var(--accent)] text-[13px] font-medium">
                  {metier.salaryRange} brut/an
                </span>
                <span className="text-[12px] text-foreground/50">Fourchette indicative, brut annuel</span>
              </div>
            )}
            {metier.tip && (
              <p className="text-[14.5px] leading-[1.85] text-foreground/82">
                {metier.tip}
              </p>
            )}
          </section>
        )}

        {/* Alerte email */}
        <section className="bg-white border border-[var(--border)] rounded-2xl px-5 sm:px-7 lg:px-9 py-6 lg:py-7 mb-3">
          <JobAlertForm
            label={metier.label + " a Monaco"}
            keywords={metier.match}
          />
        </section>

        {/* CTA inscription */}
        <div className="bg-[var(--accent)] rounded-2xl px-5 sm:px-7 lg:px-9 py-7 text-center text-background">
          <Sparks width={20} height={20} strokeWidth={1.8} className="mx-auto opacity-80" />
          <p className="font-display text-[22px] tracking-[-0.01em] mt-2">
            Vous cherchez un poste de {metier.label} ?
          </p>
          <p className="text-[13px] opacity-75 mt-1">
            Creez votre profil et postulez en un clic a toutes les offres de Monaco.
          </p>
          <div className="flex items-center justify-center gap-3 mt-4 flex-wrap">
            <Link
              href="/inscription"
              className="h-10 px-5 rounded-full bg-background text-foreground text-[13px] font-medium inline-flex items-center hover:bg-background/90 transition-colors"
            >
              Creer mon profil
            </Link>
            <Link
              href="/emploi-monaco"
              className="h-10 px-5 rounded-full border border-background/30 text-background text-[13px] font-medium inline-flex items-center hover:bg-background/10 transition-colors"
            >
              Toutes les offres
            </Link>
          </div>
        </div>
      </div>
    </Shell>
  );
}
