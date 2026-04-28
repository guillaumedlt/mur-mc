import type { Metadata } from "next";
import { Wall } from "@/components/wall/wall";
import { fetchAllJobs } from "@/lib/supabase/queries";

const SITE_URL = "https://montecarlowork.com";

export const metadata: Metadata = {
  title: "Emploi Monaco : Offres d'emploi en direct — Monte Carlo Work",
  description:
    "Toutes les offres d'emploi de la Principaute de Monaco. Banque privee, yachting, hotellerie de luxe, tech, immobilier. Postulez en direct sur Monte Carlo Work.",
  alternates: { canonical: "/" },
};

// Revalidate toutes les 60s pour que les nouvelles offres apparaissent
export const revalidate = 300;

export default async function Page() {
  const jobs = await fetchAllJobs();

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebSite",
            name: "Monte Carlo Work",
            url: SITE_URL,
            inLanguage: "fr-FR",
            description:
              "Le job board de la Principaute de Monaco.",
          }),
        }}
      />

      <h1 className="sr-only">
        Emploi Monaco — Toutes les offres d&apos;emploi de la Principaute
      </h1>

      <Wall jobs={jobs} />

      <noscript>
        <ol className="max-w-3xl mx-auto px-6 py-10 space-y-4">
          {jobs.map((j) => (
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
