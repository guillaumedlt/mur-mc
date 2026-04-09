import type { Metadata } from "next";
import { allJobs } from "@/lib/data";
import { Wall } from "@/components/wall/wall";

const SITE_URL = "https://mur.mc";

export const metadata: Metadata = {
  alternates: { canonical: "/" },
};

function homeJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "Mur.mc",
    url: SITE_URL,
    inLanguage: "fr-FR",
    description:
      "Le mur d'offres de la Principauté de Monaco. Toutes les annonces, en direct, dans une grille filtrable.",
    potentialAction: {
      "@type": "SearchAction",
      target: `${SITE_URL}/?q={search_term_string}`,
      "query-input": "required name=search_term_string",
    },
  };
}

function itemListJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "Offres d'emploi à Monaco",
    numberOfItems: allJobs.length,
    itemListElement: allJobs.slice(0, 50).map((j, i) => ({
      "@type": "ListItem",
      position: i + 1,
      url: `${SITE_URL}/jobs/${j.slug}`,
      name: `${j.title} — ${j.company.name}`,
    })),
  };
}

export default function Page() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(homeJsonLd()) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListJsonLd()) }}
      />

      {/* H1 visuellement absent pour préserver le design dashboard, mais
          présent dans le DOM pour les moteurs et lecteurs d'écran. */}
      <h1 className="sr-only">
        Toutes les offres d&apos;emploi de Monaco — Mur.mc
      </h1>

      <Wall jobs={allJobs} />

      {/* Liste sémantique offerte aux crawlers : pas de JS requis pour
          indexer les annonces. */}
      <noscript>
        <ol className="max-w-3xl mx-auto px-6 py-10 space-y-4">
          {allJobs.map((j) => (
            <li key={j.id}>
              <a
                href={`/jobs/${j.slug}`}
                className="text-foreground underline underline-offset-2"
              >
                {j.title} — {j.company.name}
              </a>
              <p className="text-sm text-muted-foreground">
                {j.type} · {j.sector} · {j.location}
              </p>
            </li>
          ))}
        </ol>
      </noscript>
    </>
  );
}
