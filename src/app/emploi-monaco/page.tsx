import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight, Bag, MapPin, Sparks } from "iconoir-react";
import { Shell } from "@/components/wall/shell";
import { JobCard } from "@/components/wall/job-card";
import { fetchAllJobs } from "@/lib/supabase/queries";

const SITE_URL = "https://mur.mc";

export const metadata: Metadata = {
  title: "Emploi a Monaco — Toutes les offres d'emploi en Principaute | Mur.mc",
  description:
    "Trouvez votre emploi a Monaco : banque privee, hotellerie de luxe, yachting, tech, immobilier. Plus de 60 000 salaries travaillent en Principaute. Consultez les offres en direct.",
  keywords: [
    "emploi Monaco",
    "offre emploi Monaco",
    "travail Monaco",
    "recrutement Monaco",
    "job Monaco",
    "carriere Monaco",
    "emploi Principaute",
    "travailler Monaco",
  ],
  alternates: { canonical: "/emploi-monaco" },
  openGraph: {
    type: "website",
    url: `${SITE_URL}/emploi-monaco`,
    title: "Emploi a Monaco — Toutes les offres | Mur.mc",
    description: "Toutes les offres d'emploi de la Principaute de Monaco, en direct.",
    siteName: "Mur.mc",
  },
};

const SECTORS = [
  { slug: "banque-finance", label: "Banque & Finance", sector: "Banque & Finance" },
  { slug: "hotellerie-restauration", label: "Hotellerie & Restauration", sector: "Hôtellerie & Restauration" },
  { slug: "tech-digital", label: "Tech & Digital", sector: "Tech & Digital" },
  { slug: "yachting", label: "Yachting", sector: "Yachting" },
  { slug: "luxe-retail", label: "Luxe & Retail", sector: "Luxe & Retail" },
  { slug: "immobilier", label: "Immobilier", sector: "Immobilier" },
  { slug: "juridique", label: "Juridique", sector: "Juridique" },
  { slug: "communication-marketing", label: "Communication & Marketing", sector: "Communication & Marketing" },
  { slug: "btp-construction", label: "BTP & Construction", sector: "BTP & Construction" },
  { slug: "ressources-humaines", label: "Ressources Humaines", sector: "Ressources Humaines" },
];

export const revalidate = 300;

function seoJsonLd(jobCount: number) {
  return {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: "Emploi a Monaco",
    description: `${jobCount} offres d'emploi a Monaco. Banque, hotellerie, tech, yachting, luxe.`,
    url: `${SITE_URL}/emploi-monaco`,
    isPartOf: { "@type": "WebSite", name: "Mur.mc", url: SITE_URL },
    breadcrumb: {
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Mur.mc", item: SITE_URL },
        { "@type": "ListItem", position: 2, name: "Emploi a Monaco", item: `${SITE_URL}/emploi-monaco` },
      ],
    },
  };
}

export default async function EmploiMonacoPage() {
  const jobs = await fetchAllJobs();

  const sectorCounts: Record<string, number> = {};
  for (const j of jobs) {
    sectorCounts[j.sector] = (sectorCounts[j.sector] ?? 0) + 1;
  }

  return (
    <Shell jobs={jobs}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(seoJsonLd(jobs.length)) }}
      />

      <div className="max-w-[1100px] mx-auto">
        {/* Hero SEO */}
        <header className="bg-white border border-[var(--border)] rounded-2xl px-5 sm:px-7 lg:px-9 py-8 lg:py-10 mb-3">
          <p className="ed-label-sm text-[var(--accent)]">Emploi a Monaco</p>
          <h1 className="font-display text-[28px] sm:text-[34px] lg:text-[40px] tracking-[-0.02em] text-foreground mt-2 leading-[1.08]">
            Toutes les offres d&apos;emploi
            <br />
            de la Principaute de Monaco
          </h1>
          <p className="text-[15px] text-muted-foreground mt-3 max-w-2xl leading-[1.7]">
            Monaco emploie plus de 60 000 salaries dans 2 km2. Banque privee, hotellerie de luxe,
            yachting, tech, immobilier, juridique : consultez {jobs.length} offres en direct
            et postulez en un clic.
          </p>
          <div className="flex flex-wrap items-center gap-2 mt-5">
            <span className="wall-badge" data-tone="accent">
              <Sparks /> {jobs.length} offres en direct
            </span>
            <span className="wall-badge" data-tone="muted">
              <MapPin /> Monaco, Principaute
            </span>
          </div>
        </header>

        {/* Sectors grid */}
        <section className="bg-white border border-[var(--border)] rounded-2xl px-5 sm:px-7 lg:px-9 py-6 lg:py-8 mb-3">
          <h2 className="font-display text-[22px] tracking-[-0.01em] text-foreground mb-5">
            Emploi par secteur
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
            {SECTORS.map((s) => {
              const count = sectorCounts[s.sector] ?? 0;
              return (
                <Link
                  key={s.slug}
                  href={`/emploi-monaco/${s.slug}`}
                  className="rounded-xl border border-[var(--border)] bg-[var(--background-alt)]/40 hover:bg-[var(--background-alt)] transition-colors p-3 group"
                >
                  <div className="text-[13px] font-medium text-foreground group-hover:text-[var(--accent)] transition-colors">
                    {s.label}
                  </div>
                  <div className="text-[11px] text-muted-foreground mt-0.5 flex items-center gap-1">
                    <Bag width={10} height={10} strokeWidth={2} />
                    {count} offre{count > 1 ? "s" : ""}
                  </div>
                </Link>
              );
            })}
          </div>
        </section>

        {/* All jobs */}
        <section className="bg-white border border-[var(--border)] rounded-2xl px-5 sm:px-7 lg:px-9 py-6 lg:py-8">
          <div className="flex items-baseline justify-between mb-5">
            <h2 className="font-display text-[22px] tracking-[-0.01em] text-foreground">
              Toutes les offres
            </h2>
            <Link
              href="/"
              className="text-[12.5px] text-[var(--accent)] hover:underline underline-offset-2 inline-flex items-center gap-1"
            >
              Voir le mur complet
              <ArrowUpRight width={11} height={11} strokeWidth={2.2} />
            </Link>
          </div>
          <div className="wall-grid" data-density="standard">
            {jobs.slice(0, 24).map((j, i) => (
              <JobCard key={j.id} job={j} index={i} />
            ))}
          </div>
          {jobs.length > 24 && (
            <div className="text-center mt-6">
              <Link
                href="/"
                className="h-10 px-5 rounded-full bg-foreground text-background text-[13px] font-medium inline-flex items-center gap-2 hover:bg-foreground/85 transition-colors"
              >
                Voir les {jobs.length} offres
              </Link>
            </div>
          )}
        </section>

        {/* SEO text */}
        <section className="bg-white border border-[var(--border)] rounded-2xl px-5 sm:px-7 lg:px-9 py-6 lg:py-8 mt-3">
          <h2 className="font-display text-[20px] tracking-[-0.01em] text-foreground mb-4">
            Travailler a Monaco en 2026
          </h2>
          <div className="text-[14.5px] text-foreground/80 leading-[1.8] space-y-4">
            <p>
              La Principaute de Monaco est l&apos;un des marches de l&apos;emploi les plus dynamiques d&apos;Europe.
              Avec un taux de chomage de 2%, plus de 5 200 entreprises et un salaire median de 52 000 EUR
              brut annuel, Monaco attire chaque jour 50 000 frontaliers venus de France et d&apos;Italie.
            </p>
            <p>
              Les secteurs qui recrutent le plus sont la banque privee et la compliance (400+ postes ouverts),
              l&apos;hotellerie de luxe (680+ postes), le BTP et la construction (520+ postes), la tech et le digital
              (310+ postes) et le yachting (240+ postes saisonniers).
            </p>
            <p>
              Mur.mc est le premier job board dedie a la Principaute de Monaco. Toutes les offres, en direct,
              dans une interface moderne et filtrable. Creez votre profil candidat pour recevoir des recommandations
              personnalisees et postulez en un clic.
            </p>
          </div>
        </section>
      </div>
    </Shell>
  );
}
