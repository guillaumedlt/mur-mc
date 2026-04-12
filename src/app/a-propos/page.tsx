import type { Metadata } from "next";
import Link from "next/link";
import { MapPin, Sparks } from "iconoir-react";
import { fetchAllJobs } from "@/lib/supabase/queries";
import { Shell } from "@/components/wall/shell";

export const metadata: Metadata = {
  title: "A propos — Mur.mc",
  description:
    "Mur.mc est le premier job board dedie a la Principaute de Monaco. Toutes les offres, en direct, sans detour.",
  alternates: { canonical: "/a-propos" },
};

export const revalidate = 3600;

export default async function AProposPage() {
  const jobs = await fetchAllJobs();

  return (
    <Shell jobs={jobs}>
      <div className="max-w-[760px] mx-auto">
        <article className="bg-white border border-[var(--border)] rounded-2xl px-5 sm:px-7 lg:px-9 py-8 lg:py-12">
          <p className="ed-label-sm text-[var(--accent)]">A propos</p>
          <h1 className="font-display text-[30px] sm:text-[36px] lg:text-[42px] tracking-[-0.02em] text-foreground mt-2 leading-[1.05]">
            Le mur d&apos;offres
            <br />
            de la Principaute.
          </h1>

          <div className="flex items-center gap-2 mt-6 text-[13px] text-muted-foreground">
            <MapPin width={13} height={13} strokeWidth={2} />
            Monaco · 2 km² · {jobs.length} offres en direct
          </div>

          <div className="mt-10 space-y-6 text-[15px] leading-[1.75] text-foreground/85">
            <p className="first-letter:font-display first-letter:text-[40px] first-letter:float-left first-letter:leading-[0.85] first-letter:mr-2 first-letter:mt-1.5">
              Monaco est un marche unique. 39 000 habitants, 60 000 emplois,
              et un ecosysteme concentre sur cinq secteurs : la banque privee,
              le yachting, la haute hotellerie, le luxe et la tech. Tout le
              monde se connait, les recruteurs s&apos;echangent les CV par
              WhatsApp, et la majorite des postes se ferment avant d&apos;etre
              publies.
            </p>

            <p>
              Mur.mc inverse cette logique. Pas de hero marketing, pas de
              barre de recherche geante. Tu arrives, tu vois toutes les offres,
              tu filtres, tu cliques. C&apos;est le produit, pas une vitrine.
            </p>

            <p>
              On construit le premier job board pense pour Monaco. Un territoire
              assez petit pour montrer « tout » d&apos;un coup (300 offres,
              parcourables en 5 minutes), mais assez riche pour que chaque offre
              soit un vrai poste, dans une vraie maison, avec un vrai
              recruteur.
            </p>
          </div>

          <div className="mt-10 rounded-xl bg-[var(--accent)]/[0.04] border border-[var(--accent)]/15 p-6">
            <div className="flex items-center gap-2 mb-3">
              <Sparks
                width={14}
                height={14}
                strokeWidth={2.2}
                className="text-[var(--accent)]"
              />
              <span className="text-[13px] font-semibold text-foreground">
                Notre mission
              </span>
            </div>
            <p className="text-[14px] text-foreground/80 leading-[1.7]">
              Rendre le marche de l&apos;emploi monegasque transparent,
              accessible et efficace — pour les candidats qui cherchent leur
              prochaine maison, et pour les recruteurs qui cherchent leur
              prochain talent.
            </p>
          </div>

          <div className="mt-10 pt-8 border-t border-[var(--border)]">
            <h2 className="font-display text-[22px] tracking-[-0.01em] text-foreground mb-4">
              Contact
            </h2>
            <p className="text-[14px] text-foreground/80 leading-[1.7]">
              Une question, un partenariat, une idee ? Ecrivez-nous a{" "}
              <a
                href="mailto:contact@mur.mc"
                className="text-[var(--accent)] hover:underline underline-offset-2"
              >
                contact@mur.mc
              </a>
            </p>
          </div>

          <div className="mt-8 flex items-center justify-center gap-3">
            <Link
              href="/"
              className="h-10 px-5 rounded-full bg-foreground text-background text-[13px] font-medium hover:bg-foreground/85 transition-colors flex items-center"
            >
              Voir les offres
            </Link>
            <Link
              href="/tarifs"
              className="h-10 px-5 rounded-full border border-[var(--border)] bg-white text-[13px] text-foreground/85 hover:bg-[var(--background-alt)] transition-colors flex items-center"
            >
              Nos tarifs
            </Link>
          </div>
        </article>
      </div>
    </Shell>
  );
}
