import type { Metadata } from "next";
import Link from "next/link";
import { Wall } from "@/components/wall/wall";
import { fetchAllJobs } from "@/lib/supabase/queries";

const SITE_URL = "https://mur.mc";

export const metadata: Metadata = {
  title: "Emploi Monaco : Offres d'emploi en direct — Mur.mc",
  description:
    "Toutes les offres d'emploi de la Principaute de Monaco. Banque privee, yachting, hotellerie de luxe, tech, immobilier. Postulez en direct sur Mur.mc.",
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
        Emploi Monaco — Toutes les offres d&apos;emploi de la Principaute
      </h1>

      <Wall jobs={jobs} />

      {/* Section editoriale SEO — visible sous le wall, indexee par Google */}
      <section className="max-w-[1100px] mx-auto mt-3 bg-white border border-[var(--border)] rounded-2xl px-5 sm:px-7 lg:px-9 py-6 lg:py-9">
        <h2 className="font-display text-[22px] sm:text-[26px] tracking-[-0.015em] text-foreground mb-4">
          Le mur d&apos;offres de Monaco
        </h2>
        <div className="text-[14.5px] leading-[1.85] text-foreground/80 flex flex-col gap-4 max-w-3xl">
          <p>
            Mur.mc est le premier job board dedie a la Principaute de Monaco. Nous
            rassemblons toutes les offres d&apos;emploi des entreprises monegasques — banques
            privees, groupes hotellerie de luxe, chantiers navals du yachting, maisons de
            couture, cabinets juridiques et startups tech — dans une interface dense,
            filtrable en un clic.
          </p>
          <p>
            Avec plus de 60 000 salaries pour 39 000 habitants, Monaco est un marche de
            l&apos;emploi unique en Europe. Les postes sont souvent pourvus par cooptation et
            bouche-a-oreille. Notre mission : rendre chaque opportunite visible et
            accessible a tous, en direct, sans intermediaire.
          </p>
        </div>
        <div className="flex flex-wrap gap-2 mt-6">
          <Link href="/emploi-monaco" className="wall-badge hover:bg-[var(--accent)]/10 transition-colors" data-tone="accent">
            Emploi par secteur
          </Link>
          <Link href="/emploi-monaco/metier" className="wall-badge hover:bg-[var(--accent)]/10 transition-colors" data-tone="accent">
            Emploi par metier
          </Link>
          <Link href="/entreprises" className="wall-badge hover:bg-[var(--accent)]/10 transition-colors" data-tone="muted">
            Entreprises qui recrutent
          </Link>
          <Link href="/travailler-monaco" className="wall-badge hover:bg-[var(--accent)]/10 transition-colors" data-tone="muted">
            Guide : travailler a Monaco
          </Link>
          <Link href="/stories" className="wall-badge hover:bg-[var(--accent)]/10 transition-colors" data-tone="muted">
            Magazine Monaco
          </Link>
        </div>
      </section>

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
