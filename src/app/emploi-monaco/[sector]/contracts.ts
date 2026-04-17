/**
 * Landing pages par type de contrat. Servies par le meme [sector] catch-all
 * que les pages sectorielles, mais filtrees par job.type au lieu de sector.
 */
export const CONTRACT_MAP: Record<string, { label: string; type: string; description: string }> = {
  cdi: {
    label: "CDI",
    type: "CDI",
    description:
      "Contrat a duree indeterminee a Monaco. Stabilite, couverture CCSS, avantages sociaux monegasques. Le CDI represente la majorite des postes en Principaute.",
  },
  cdd: {
    label: "CDD",
    type: "CDD",
    description:
      "Contrat a duree determinee a Monaco. Missions temporaires, saisonniers, remplacements. Frequents dans l'hotellerie et l'evenementiel.",
  },
  stage: {
    label: "Stage",
    type: "Stage",
    description:
      "Stages en entreprise a Monaco. Banque, luxe, tech, juridique. Duree 3 a 6 mois, generalement remuneres au-dessus du minimum legal francais.",
  },
  alternance: {
    label: "Alternance",
    type: "Alternance",
    description:
      "Contrats en alternance a Monaco. Combinez formation et experience professionnelle en Principaute. Secteurs tech, finance, hotellerie.",
  },
  freelance: {
    label: "Freelance",
    type: "Freelance",
    description:
      "Missions freelance a Monaco. Consultants, experts, independants. Tech, conseil, marketing, yachting. Missions courtes ou longues durees.",
  },
};

export const CONTRACT_SLUGS = Object.keys(CONTRACT_MAP);
