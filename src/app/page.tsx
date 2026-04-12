import type { Metadata } from "next";
import { Wall } from "@/components/wall/wall";
import { fetchAllJobs } from "@/lib/supabase/queries";

const SITE_URL = "https://mur.mc";

export const metadata: Metadata = {
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
            name: "Mur.mc",
            url: SITE_URL,
            inLanguage: "fr-FR",
            description:
              "Le mur d'offres de la Principaute de Monaco.",
          }),
        }}
      />

      <h1 className="sr-only">
        Toutes les offres d&apos;emploi de Monaco — Mur.mc
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
