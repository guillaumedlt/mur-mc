import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, Bag } from "iconoir-react";
import { Shell } from "@/components/wall/shell";
import { fetchAllJobs } from "@/lib/supabase/queries";
import { matchJobsByKeywords } from "@/lib/seo/match-jobs";
import { METIERS } from "./metiers";

const SITE_URL = "https://mur.mc";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "Emploi par metier a Monaco — Tous les postes | Mur.mc",
  description:
    "Consultez toutes les offres d'emploi a Monaco par metier : comptable, developpeur, chef de rang, avocat, vendeur luxe, capitaine de yacht et 50+ autres.",
  keywords: [
    "emploi metier monaco",
    "offre emploi monaco par poste",
    "job monaco par metier",
    "tous les metiers monaco",
  ],
  alternates: { canonical: "/emploi-monaco/metier" },
  openGraph: {
    type: "website",
    url: `${SITE_URL}/emploi-monaco/metier`,
    title: "Emploi par metier a Monaco | Mur.mc",
    description: "50+ metiers, toutes les offres d'emploi de Monaco par poste.",
    siteName: "Mur.mc",
    locale: "fr_MC",
  },
};

export default async function MetierHubPage() {
  const allJobs = await fetchAllJobs();

  // Group by sector + compute counts
  const bySector = new Map<string, Array<{ slug: string; label: string; count: number }>>();
  for (const m of METIERS) {
    const count = matchJobsByKeywords(allJobs, m.match).length;
    const list = bySector.get(m.sector) ?? [];
    list.push({ slug: m.slug, label: m.label, count });
    bySector.set(m.sector, list);
  }

  // Sort sectors by total jobs descending
  const sectors = Array.from(bySector.entries())
    .map(([sector, items]) => ({
      sector,
      items: items.sort((a, b) => b.count - a.count),
      total: items.reduce((s, i) => s + i.count, 0),
    }))
    .sort((a, b) => b.total - a.total);

  const totalMetiers = METIERS.length;
  const totalJobs = allJobs.length;

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Mur.mc", item: SITE_URL },
      { "@type": "ListItem", position: 2, name: "Emploi a Monaco", item: `${SITE_URL}/emploi-monaco` },
      { "@type": "ListItem", position: 3, name: "Par metier", item: `${SITE_URL}/emploi-monaco/metier` },
    ],
  };

  return (
    <Shell jobs={allJobs}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />

      <div className="max-w-[1100px] mx-auto">
        <nav className="flex items-center gap-1.5 text-[12px] text-foreground/50 mb-3 px-1">
          <Link href="/emploi-monaco" className="hover:text-foreground transition-colors">
            <ArrowLeft width={11} height={11} strokeWidth={2} className="inline mr-1" />
            Emploi Monaco
          </Link>
          <span>/</span>
          <span className="text-foreground/70">Par metier</span>
        </nav>

        <header className="bg-white border border-[var(--border)] rounded-2xl px-5 sm:px-7 lg:px-9 py-8 lg:py-10 mb-3">
          <p className="ed-label-sm text-[var(--accent)]">Tous les metiers</p>
          <h1 className="font-display text-[28px] sm:text-[34px] lg:text-[38px] leading-[1.08] tracking-[-0.02em] text-foreground mt-2">
            Emploi par metier a Monaco
          </h1>
          <p className="text-[15px] text-muted-foreground mt-3 max-w-2xl leading-[1.7]">
            {totalMetiers} metiers references, {totalJobs} offres d&apos;emploi
            en direct en Principaute de Monaco. Cliquez sur un metier pour voir
            les offres correspondantes.
          </p>
        </header>

        {sectors.map(({ sector, items }) => (
          <section
            key={sector}
            className="bg-white border border-[var(--border)] rounded-2xl px-5 sm:px-7 lg:px-9 py-6 lg:py-7 mb-3"
          >
            <h2 className="font-display text-[18px] tracking-[-0.01em] text-foreground mb-4">
              {sector}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
              {items.map((m) => (
                <Link
                  key={m.slug}
                  href={`/emploi-monaco/metier/${m.slug}`}
                  className="group flex items-center justify-between gap-3 px-4 py-3 rounded-xl border border-[var(--border)] hover:border-[var(--accent)]/40 hover:bg-[var(--accent)]/[0.03] transition-colors"
                >
                  <span className="text-[13.5px] text-foreground group-hover:text-[var(--accent)] transition-colors truncate">
                    {m.label}
                  </span>
                  <span className="inline-flex items-center gap-1 text-[11px] font-mono text-foreground/45 shrink-0">
                    <Bag width={10} height={10} strokeWidth={2} />
                    {m.count}
                  </span>
                </Link>
              ))}
            </div>
          </section>
        ))}
      </div>
    </Shell>
  );
}
