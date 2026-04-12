import type { Metadata } from "next";
import Link from "next/link";
import { BadgeCheck, Bag, Rocket, Sparks } from "iconoir-react";
import { fetchAllJobs } from "@/lib/supabase/queries";
import { Shell } from "@/components/wall/shell";

export const metadata: Metadata = {
  title: "Tarifs — Publiez vos offres sur Mur.mc",
  description:
    "Decouvrez nos formules pour recruter a Monaco. De gratuit a premium, trouvez le plan adapte a vos besoins.",
  alternates: { canonical: "/tarifs" },
};

const PLANS = [
  {
    name: "Starter",
    price: "Gratuit",
    period: "",
    description: "Pour tester le mur avec une premiere offre.",
    features: [
      "1 offre active",
      "Fiche entreprise basique",
      "Candidatures illimitees",
      "Dashboard de suivi",
    ],
    cta: "Commencer gratuitement",
    href: "/inscription",
    accent: false,
  },
  {
    name: "Growth",
    price: "290 EUR",
    period: "/ offre",
    description: "Pour les entreprises qui recrutent regulierement a Monaco.",
    features: [
      "Offres illimitees",
      "Fiche entreprise premium (blocs, photos, cover)",
      "Pipeline kanban drag & drop",
      "Import CSV candidats",
      "Messages IA pre-rediges",
      "Equipe multi-utilisateurs",
      "Boost offre inclus (1 / offre)",
    ],
    cta: "Choisir Growth",
    href: "/inscription",
    accent: true,
  },
  {
    name: "Talent Partner",
    price: "Sur devis",
    period: "",
    description: "Pour les groupes et les besoins volume.",
    features: [
      "Tout Growth inclus",
      "Account manager dedie",
      "Offres sponsorisees en page d'accueil",
      "Analytics avances",
      "API d'integration (ATS, SIRH)",
      "Marque employeur personnalisee",
    ],
    cta: "Nous contacter",
    href: "mailto:contact@mur.mc",
    accent: false,
  },
];

export const revalidate = 3600;

export default async function TarifsPage() {
  const jobs = await fetchAllJobs();

  return (
    <Shell jobs={jobs}>
      <div className="max-w-[1100px] mx-auto">
        <header className="text-center mb-10">
          <p className="ed-label-sm text-[var(--accent)]">Tarifs</p>
          <h1 className="font-display text-[30px] sm:text-[36px] lg:text-[42px] tracking-[-0.02em] text-foreground mt-2">
            Recrutez a Monaco,
            <br />
            simplement.
          </h1>
          <p className="text-[15px] text-muted-foreground mt-3 max-w-lg mx-auto">
            Publiez vos offres sur le mur, gerez vos candidatures dans un
            pipeline visuel, et trouvez vos talents monegasques.
          </p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {PLANS.map((plan) => (
            <div
              key={plan.name}
              className={`bg-white border rounded-2xl p-6 sm:p-8 flex flex-col ${
                plan.accent
                  ? "border-[var(--accent)] ring-2 ring-[var(--accent)]/10"
                  : "border-[var(--border)]"
              }`}
            >
              {plan.accent && (
                <div className="flex items-center gap-1.5 mb-4">
                  <Sparks
                    width={12}
                    height={12}
                    strokeWidth={2.2}
                    className="text-[var(--accent)]"
                  />
                  <span className="text-[11px] uppercase tracking-[0.09em] font-semibold text-[var(--accent)]">
                    Le plus populaire
                  </span>
                </div>
              )}

              <h2 className="font-display text-[22px] tracking-[-0.01em] text-foreground">
                {plan.name}
              </h2>

              <div className="flex items-baseline gap-1 mt-2">
                <span className="font-display text-[36px] tracking-[-0.02em] text-foreground">
                  {plan.price}
                </span>
                {plan.period && (
                  <span className="text-[14px] text-muted-foreground">
                    {plan.period}
                  </span>
                )}
              </div>

              <p className="text-[13.5px] text-muted-foreground mt-2 leading-snug">
                {plan.description}
              </p>

              <ul className="flex flex-col gap-2.5 mt-6 flex-1">
                {plan.features.map((f) => (
                  <li
                    key={f}
                    className="flex items-start gap-2 text-[13px] text-foreground/85"
                  >
                    <BadgeCheck
                      width={14}
                      height={14}
                      strokeWidth={2}
                      className={`mt-0.5 shrink-0 ${
                        plan.accent
                          ? "text-[var(--accent)]"
                          : "text-foreground/45"
                      }`}
                    />
                    {f}
                  </li>
                ))}
              </ul>

              <Link
                href={plan.href}
                className={`mt-6 h-11 rounded-xl text-[13.5px] font-medium flex items-center justify-center gap-2 transition-colors ${
                  plan.accent
                    ? "bg-foreground text-background hover:bg-foreground/85"
                    : "border border-[var(--border)] bg-white text-foreground/85 hover:bg-[var(--background-alt)]"
                }`}
              >
                {plan.name === "Growth" && (
                  <Rocket width={14} height={14} strokeWidth={2} />
                )}
                {plan.name === "Starter" && (
                  <Bag width={14} height={14} strokeWidth={2} />
                )}
                {plan.cta}
              </Link>
            </div>
          ))}
        </div>

        <p className="text-center text-[12.5px] text-muted-foreground mt-8">
          Tous les prix sont hors taxes. Facturation par offre, sans engagement.
        </p>
      </div>
    </Shell>
  );
}
