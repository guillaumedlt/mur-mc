import type { Metadata } from "next";
import Link from "next/link";
import { Check, Sparks } from "iconoir-react";
import { Shell } from "@/components/wall/shell";
import { fetchAllJobs } from "@/lib/supabase/queries";

const SITE_URL = "https://mur.mc";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Tarifs recruteur — Publiez vos offres a Monaco | Mur.mc",
  description:
    "Decouvrez les forfaits Mur.mc pour publier vos offres d'emploi a Monaco. De 3 a 10 annonces, ou sur mesure.",
  alternates: { canonical: "/tarifs" },
  openGraph: {
    type: "website",
    url: `${SITE_URL}/tarifs`,
    title: "Tarifs recruteur — Mur.mc",
    siteName: "Mur.mc",
  },
};

const PLANS = [
  {
    name: "Starter",
    price: "Gratuit",
    period: "",
    jobs: "3 annonces actives",
    highlight: false,
    features: [
      "Fiche entreprise publique",
      "Pipeline candidatures (kanban)",
      "Candidatures illimitees",
      "Notifications email",
    ],
  },
  {
    name: "Pro",
    price: "Sur devis",
    period: "",
    jobs: "6 annonces actives",
    highlight: true,
    features: [
      "Tout Starter +",
      "Fiche entreprise enrichie (photos, video)",
      "Messages candidats assistes par IA",
      "Import CSV de candidats",
      "Scorecards d'entretien personnalisees",
      "Reporting & analytics",
    ],
  },
  {
    name: "Business",
    price: "Sur devis",
    period: "",
    jobs: "10 annonces actives",
    highlight: false,
    features: [
      "Tout Pro +",
      "Equipe multi-utilisateurs (admin, recruteur, viewer)",
      "Templates d'offres reutilisables",
      "Widget carriere embeddable",
      "Systeme de cooptation",
      "Support prioritaire",
    ],
  },
  {
    name: "Sur mesure",
    price: "Sur devis",
    period: "",
    jobs: "Annonces illimitees",
    highlight: false,
    features: [
      "Tout Business +",
      "Offres illimitees",
      "Account manager dedie",
      "API & integrations ATS/HRIS",
      "Marque employeur premium",
      "Mise en avant sur le mur",
    ],
  },
];

export default async function TarifsPage() {
  const jobs = await fetchAllJobs();

  return (
    <Shell jobs={jobs}>
      <div className="max-w-[1100px] mx-auto">
        <header className="bg-white border border-[var(--border)] rounded-2xl px-5 sm:px-7 lg:px-9 py-8 lg:py-12 mb-3 text-center">
          <p className="ed-label-sm text-[var(--accent)]">Tarifs</p>
          <h1 className="font-display text-[28px] sm:text-[34px] lg:text-[40px] leading-[1.08] tracking-[-0.02em] text-foreground mt-2">
            Recrutez a Monaco, simplement
          </h1>
          <p className="text-[15px] text-muted-foreground mt-3 max-w-xl mx-auto leading-[1.7]">
            Choisissez le forfait adapte a vos besoins. Pas d&apos;engagement,
            facturation a l&apos;offre. Tous les prix sont hors taxes.
          </p>
        </header>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-3">
          {PLANS.map((plan) => (
            <div
              key={plan.name}
              className={`bg-white border rounded-2xl px-5 py-6 flex flex-col ${
                plan.highlight
                  ? "border-[var(--accent)] ring-2 ring-[var(--accent)]/20"
                  : "border-[var(--border)]"
              }`}
            >
              {plan.highlight && (
                <span className="inline-flex items-center gap-1 text-[10px] uppercase tracking-[0.08em] font-semibold text-[var(--accent)] mb-2">
                  <Sparks width={10} height={10} strokeWidth={2.2} />
                  Recommande
                </span>
              )}
              <h3 className="font-display text-[20px] tracking-[-0.01em] text-foreground">
                {plan.name}
              </h3>
              <p className="font-display text-[28px] tracking-[-0.02em] text-foreground mt-2">
                {plan.price}
              </p>
              <p className="text-[13px] text-[var(--accent)] font-medium mt-1">
                {plan.jobs}
              </p>

              <ul className="flex flex-col gap-2 mt-5 flex-1">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-[12.5px] text-foreground/80">
                    <span className="mt-[3px] size-[16px] rounded-md bg-[var(--accent)]/10 text-[var(--accent)] flex items-center justify-center shrink-0">
                      <Check width={10} height={10} strokeWidth={2.4} />
                    </span>
                    {f}
                  </li>
                ))}
              </ul>

              <Link
                href={plan.name === "Starter" ? "/inscription" : "/inscription"}
                className={`mt-5 h-11 rounded-xl text-[13px] font-medium flex items-center justify-center transition-colors ${
                  plan.highlight
                    ? "bg-foreground text-background hover:bg-foreground/85"
                    : "border border-[var(--border)] bg-white text-foreground/80 hover:border-foreground/30 hover:text-foreground"
                }`}
              >
                {plan.name === "Starter" ? "Commencer gratuitement" : "Nous contacter"}
              </Link>
            </div>
          ))}
        </div>

        <div className="bg-white border border-[var(--border)] rounded-2xl px-5 sm:px-7 lg:px-9 py-6 text-center text-[13.5px] text-muted-foreground">
          Des questions ? Ecrivez-nous a{" "}
          <a href="mailto:contact@mur.mc" className="text-[var(--accent)] hover:underline underline-offset-2">
            contact@mur.mc
          </a>
        </div>
      </div>
    </Shell>
  );
}
