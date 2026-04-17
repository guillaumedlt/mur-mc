import { METIERS, type MetierDef } from "./metiers";

/**
 * Pages croisees metier × secteur pour le SEO long-tail.
 * Ex: "emploi comptable banque monaco" → /emploi-monaco/metier/comptable-banque-finance
 *
 * On genere uniquement les combinaisons pertinentes (metier.sector = sector cible
 * ou metier est transversal). Le sitemap ne les inclut que si jobs > 0.
 */

const CROSS_SECTORS = [
  { slug: "banque-finance", label: "Banque & Finance", sector: "Banque & Finance" },
  { slug: "hotellerie-restauration", label: "Hotellerie", sector: "Hôtellerie & Restauration" },
  { slug: "yachting", label: "Yachting", sector: "Yachting" },
  { slug: "luxe-retail", label: "Luxe", sector: "Luxe & Retail" },
  { slug: "tech-digital", label: "Tech", sector: "Tech & Digital" },
  { slug: "immobilier", label: "Immobilier", sector: "Immobilier" },
];

export type CrossDef = {
  slug: string;
  metier: MetierDef;
  sectorSlug: string;
  sectorLabel: string;
  sectorFilter: string;
};

/** Transversal metiers que l'on croise avec plusieurs secteurs. */
const TRANSVERSAL_SLUGS = new Set([
  "assistant-de-direction",
  "commercial",
  "marketing",
  "ressources-humaines",
  "comptable",
  "controleur-de-gestion",
]);

export const CROSS_PAGES: CrossDef[] = [];

for (const metier of METIERS) {
  for (const sec of CROSS_SECTORS) {
    // On genere le croisement si :
    //  - Le metier est dans ce secteur, OU
    //  - Le metier est transversal
    const isSameSector = metier.sector === sec.sector || metier.sector === sec.label;
    if (!isSameSector && !TRANSVERSAL_SLUGS.has(metier.slug)) continue;

    CROSS_PAGES.push({
      slug: `${metier.slug}-${sec.slug}`,
      metier,
      sectorSlug: sec.slug,
      sectorLabel: sec.label,
      sectorFilter: sec.sector,
    });
  }
}

export const CROSS_SLUGS = CROSS_PAGES.map((c) => c.slug);
