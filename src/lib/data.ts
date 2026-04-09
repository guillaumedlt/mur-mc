export type JobType =
  | "CDI"
  | "CDD"
  | "Stage"
  | "Alternance"
  | "Freelance"
  | "Saison";

export type ExperienceLevel =
  | "Junior"
  | "Confirmé"
  | "Senior"
  | "Manager"
  | "Direction";

export type Sector =
  | "Banque & Finance"
  | "Yachting"
  | "Hôtellerie & Restauration"
  | "Luxe & Retail"
  | "Tech & Digital"
  | "Immobilier"
  | "Juridique"
  | "Sport & Bien-être"
  | "Événementiel"
  | "Famille / Office";

export type Company = {
  id: string;
  slug: string;
  name: string;
  logoColor: string;
  initials: string;
  /** Domaine utilisé pour récupérer le logo via Clearbit. */
  domain?: string;
  sector: Sector;
  size: string;
  description: string;
  /** Phrase d'accroche éditoriale, courte. Mode "rich" uniquement. */
  tagline?: string;
  /** Active la fiche immersive avec photos (mode "rich" type WTTJ). */
  hasCover?: boolean;
  /** Positionnement marché : ce que fait l'entreprise, comment elle se distingue. */
  positioning?: string;
  /** Culture, environnement de travail, en prose. */
  culture?: string;
  location: string;
  website?: string;
  founded?: number;
  perks: string[];
};

export type Locale = "fr" | "en";

export type WorkTime = "Temps plein" | "Temps partiel";

/**
 * Tranches d'expérience utilisées par les filtres.
 * Mapping appliqué dans `experienceMatches`.
 */
export type ExperienceBucket = "debutant" | "1-3" | "3-5" | "5+";

export type Job = {
  id: string;
  slug: string;
  title: string;
  company: Company;
  type: JobType;
  level: ExperienceLevel;
  sector: Sector;
  location: string; // ex: Monaco, Fontvieille
  lat: number;
  lng: number;
  remote: "Sur site" | "Hybride" | "Full remote";
  workTime: WorkTime;
  salaryMin?: number;
  salaryMax?: number;
  currency: "EUR";
  postedAt: string; // ISO
  /**
   * Langue dans laquelle l'offre est publiée. Une offre est publiée
   * dans une seule langue (au choix de l'employeur).
   */
  lang: Locale;
  languages: string[];
  tags: string[];
  shortDescription: string;
  description: string;
  responsibilities: string[];
  requirements: string[];
  benefits: string[];
  featured?: boolean;
  urgent?: boolean;
};

export const sectors: { name: Sector; count: number }[] = [
  { name: "Banque & Finance", count: 42 },
  { name: "Yachting", count: 31 },
  { name: "Hôtellerie & Restauration", count: 58 },
  { name: "Luxe & Retail", count: 27 },
  { name: "Tech & Digital", count: 19 },
  { name: "Immobilier", count: 23 },
  { name: "Juridique", count: 14 },
  { name: "Sport & Bien-être", count: 11 },
  { name: "Événementiel", count: 16 },
  { name: "Famille / Office", count: 9 },
];

export const companies: Company[] = [
  {
    id: "c1",
    slug: "cmb-monaco",
    name: "CMB Monaco",
    logoColor: "#1e3a8a",
    initials: "CMB",
    domain: "cmb.mc",
    sector: "Banque & Finance",
    size: "200-500",
    location: "Monaco — Carré d'Or",
    description:
      "Compagnie Monégasque de Banque. Banque privée monégasque de référence, accompagnement de familles UHNW depuis 1976. Gestion discrétionnaire, structuration patrimoniale internationale.",
    positioning:
      "Spécialisée dans la gestion de fortune et la structuration patrimoniale internationale pour une clientèle ultra haut-de-gamme. Le portefeuille couvre familles européennes, moyen-orientales et asiatiques, avec une expertise particulière sur les structures à plusieurs juridictions.",
    culture:
      "Une maison de tradition où l'exigence, la confidentialité et la stabilité priment. Les équipes sont seniorisées, les carrières longues, et la formation continue est fortement encouragée. Le tutoiement n'est pas la règle, le travail bien fait l'est.",
    website: "cmb.mc",
    founded: 1976,
    tagline: "La discrétion bancaire monégasque, depuis presque 50 ans.",
    hasCover: true,
    perks: ["Mutuelle famille", "13e mois", "Tickets restaurant", "Logement aidé"],
  },
  {
    id: "c2",
    slug: "edmiston",
    name: "Edmiston",
    logoColor: "#0f172a",
    initials: "ED",
    domain: "edmiston.com",
    sector: "Yachting",
    size: "50-200",
    location: "Port Hercule",
    description:
      "Brokerage et management de superyachts (40m+). Bureaux Monaco, Fort Lauderdale, Palma. 80 yachts sous gestion.",
    positioning:
      "L'un des trois acteurs majeurs du brokerage superyacht en Méditerranée. Activité historique : transactions sur le segment 40-90m, avec une montée progressive sur le 100m+. Réseau armateurs international, présence sur tous les boat shows majeurs.",
    culture:
      "Équipe internationale, anglais courant exigé, culture commerciale forte. Les déplacements sont fréquents (Cannes, Monaco, Fort Lauderdale, Dubai). Rémunération principalement variable, ambiance entrepreneuriale, peu de hiérarchie.",
    website: "edmiston.com",
    founded: 1996,
    tagline: "Brokerage de superyachts. Des Caraïbes à la Méditerranée.",
    hasCover: true,
    perks: ["Voyages internationaux", "Boat shows", "Bonus performance"],
  },
  {
    id: "c3",
    slug: "sbm-monte-carlo",
    name: "Monte-Carlo Société des Bains de Mer",
    logoColor: "#7c1d2c",
    initials: "SBM",
    domain: "montecarlosbm.com",
    sector: "Hôtellerie & Restauration",
    size: "200-500",
    location: "Monte-Carlo",
    description:
      "Le groupe historique fondé en 1863 qui opère l'Hôtel de Paris, l'Hôtel Hermitage, le Monte-Carlo Beach, le Casino, et les restaurants étoilés de la Principauté.",
    positioning:
      "Adresse historique du Carré d'Or monégasque, ouverte en 1898 et continuellement rénovée. Clientèle internationale fidélisée, séjours longs, événements privés haut de gamme. Membre du club très restreint des Leading Hotels of the World.",
    culture:
      "L'excellence du service est au cœur de tout. Les équipes sont multilingues (FR/EN/IT a minima), formées en interne, et les évolutions de carrière entre départements sont encouragées. Logement à proximité, repas pris sur place, ambiance familiale derrière la rigueur du palace.",
    founded: 1863,
    website: "montecarlosbm.com",
    tagline:
      "Le groupe historique qui fait vivre Monte-Carlo depuis 1863. Hôtel de Paris, Hermitage, Casino, étoiles Michelin.",
    hasCover: true,
    perks: ["Logement", "Repas", "Réductions groupe", "Formation continue"],
  },
  {
    id: "c4",
    slug: "monaco-telecom",
    name: "Monaco Telecom",
    logoColor: "#e30613",
    initials: "MT",
    domain: "monaco-telecom.mc",
    sector: "Tech & Digital",
    size: "10-50",
    location: "Fontvieille",
    description:
      "Studio produit & IA pour les acteurs du yachting et du luxe. On construit des SaaS B2B utilisés par 400+ clients en Europe.",
    positioning:
      "Studio produit indépendant qui développe et opère des SaaS B2B verticaux : gestion de flotte yacht, CRM clientèle UHNW, outils de réservation pour palaces. 400+ clients actifs en Europe, croissance rentable, sans levée de fonds.",
    culture:
      "Petite équipe (8), fortement seniorisée, ownership produit total. On bosse sur des problèmes concrets d'utilisateurs payants, pas sur du prototype. Flexibilité totale sur le mode de travail (2 jours télétravail / semaine), MacBook Pro M4, conf budget annuel.",
    founded: 1991,
    website: "monaco-telecom.mc",
    tagline: "Le réseau qui fait tourner la Principauté. 5G, fibre, B2B.",
    hasCover: true,
    perks: ["Stock options", "Full remote possible", "MacBook Pro M4", "Conf budget"],
  },
  {
    id: "c5",
    slug: "cartier-monte-carlo",
    name: "Cartier Monte-Carlo",
    logoColor: "#a31621",
    initials: "CA",
    domain: "cartier.com",
    sector: "Luxe & Retail",
    size: "50-200",
    location: "Avenue des Beaux-Arts",
    description:
      "Maison de joaillerie haute-couture, ateliers Place Vendôme et Monte-Carlo. Clientèle internationale, pièces uniques.",
    positioning:
      "Maison familiale fondée en 1956, spécialisée dans la haute joaillerie et les pièces sur-mesure. Clientèle de collectionneurs internationaux. Production confidentielle, ateliers internalisés à Paris et Monaco.",
    culture:
      "Maison familiale aux codes traditionnels du luxe. Service client haut de gamme, formation interne aux pierres et à la création, voyages réguliers pour rencontrer les clients VIP. Tenue impeccable exigée, savoir-être avant tout.",
    founded: 1847,
    website: "cartier.com",
    perks: ["Commission sur vente", "Voyages clients", "Mutuelle premium"],
  },
  {
    id: "c6",
    slug: "savills-monaco",
    name: "Savills Monaco",
    logoColor: "#062b3e",
    initials: "SA",
    domain: "savills.mc",
    sector: "Immobilier",
    size: "10-50",
    location: "Monaco-Ville",
    description:
      "Agence indépendante spécialisée dans l'immobilier de prestige monégasque. Mandat exclusif sur 60+ biens d'exception.",
    positioning:
      "Agence indépendante de référence sur le marché de l'ultra-luxe monégasque. Spécialisation : penthouses, hôtels particuliers, biens emblématiques avec mandats exclusifs. Clientèle internationale principalement.",
    culture:
      "Petite équipe rodée, ambiance commerciale exigeante mais conviviale. Mandats fournis, portefeuille porté par l'image de l'agence. Voiture de fonction et tous les outils sont mis à disposition pour libérer le négociateur sur ce qui compte : la transaction.",
    founded: 1855,
    website: "savills.mc",
    perks: ["Commission attractive", "Voiture de fonction", "Portefeuille fourni"],
  },
  {
    id: "c7",
    slug: "cms-pasquier-ciulla",
    name: "CMS Pasquier Ciulla Marquet Pastor & Svara",
    logoColor: "#0d2235",
    initials: "CMS",
    domain: "cms.law",
    sector: "Juridique",
    size: "10-50",
    location: "Boulevard des Moulins",
    description:
      "Cabinet d'avocats d'affaires, droit monégasque et international. Corporate, fiscal, contentieux financier.",
    positioning:
      "Cabinet établi depuis 1989 sur le marché monégasque, intervenant en corporate, fiscal et contentieux financier. Clientèle institutionnelle et entrepreneuriale, structuration internationale, M&A.",
    culture:
      "Cabinet à taille humaine, exigence académique, formation continue prise au sérieux. La carrière y est progressive, l'inscription au barreau de Monaco accompagnée si nécessaire. Bibliothèque interne, accès aux bases juridiques internationales.",
    founded: 2009,
    website: "cms.law",
    perks: ["Bibliothèque pro", "Formation barreau", "Bonus annuel"],
  },
  {
    id: "c8",
    slug: "monte-carlo-country-club",
    name: "Monte-Carlo Country Club",
    logoColor: "#0a4d3a",
    initials: "MCC",
    domain: "mccc.mc",
    sector: "Sport & Bien-être",
    size: "50-200",
    location: "Roquebrune-Cap-Martin",
    description:
      "Club historique du Rolex Monte-Carlo Masters. 23 courts, restaurant, école de tennis enfants & adultes.",
    positioning:
      "Club historique fondé en 1928, hôte du Rolex Monte-Carlo Masters chaque mois d'avril. 23 courts (terre battue, dur, indoor), restaurant panoramique, école de tennis enfants et adultes, événements privés.",
    culture:
      "Cadre exceptionnel surplombant la mer, équipe de moniteurs diplômés d'État, ambiance club privé. La saison ATP rythme l'année, les recrutements sont fortement valorisés à cette période. Repas inclus, tenues fournies.",
    founded: 1928,
    website: "mccc.mc",
    perks: ["Accès courts", "Tournois ATP", "Repas inclus"],
  },
];

const byId = Object.fromEntries(companies.map((c) => [c.id, c]));

export const jobs: Job[] = [
  {
    id: "j1",
    slug: "wealth-manager-senior",
    title: "Wealth Manager Senior — Clientèle UHNW",
    company: byId["c1"],
    type: "CDI",
    level: "Senior",
    sector: "Banque & Finance",
    location: "Monaco — Carré d'Or",
    lat: 43.7385,
    lng: 7.4270,
    remote: "Sur site",
    workTime: "Temps plein",
    salaryMin: 110000,
    salaryMax: 180000,
    currency: "EUR",
    postedAt: "2026-04-02",
    lang: "fr",
    languages: ["Français", "Anglais", "Italien"],
    tags: ["UHNW", "Gestion privée", "Portefeuille existant"],
    shortDescription:
      "Reprise d'un portefeuille de 60 familles UHNW (AUM 800M€). Équipe senior, environnement entrepreneurial.",
    description:
      "Vous reprenez un portefeuille existant de 60 familles UHNW (AUM 800M€) et accompagnez la croissance organique avec l'appui d'une équipe d'investissement et de structuration patrimoniale.",
    responsibilities: [
      "Gestion et développement d'un portefeuille de familles UHNW internationales",
      "Coordination avec les équipes investissement, crédit, structuration",
      "Reporting client mensuel et revues de portefeuille trimestrielles",
      "Veille marché et benchmarks de performance",
    ],
    requirements: [
      "10+ ans en banque privée, idéalement Monaco / Suisse / Luxembourg",
      "Portefeuille transférable apprécié",
      "Certifications AMF / FINMA",
      "Trilingue FR/EN/IT exigé",
    ],
    benefits: [
      "Package fixe + variable performance",
      "Logement aidé Monaco",
      "Mutuelle famille premium",
      "13e mois",
    ],
    featured: true,
  },
  {
    id: "j2",
    slug: "yacht-broker",
    title: "Yacht Broker — Sales (40m+)",
    company: byId["c2"],
    type: "CDI",
    level: "Confirmé",
    sector: "Yachting",
    location: "Port Hercule",
    lat: 43.7340,
    lng: 7.4210,
    remote: "Hybride",
    workTime: "Temps plein",
    salaryMin: 70000,
    salaryMax: 250000,
    currency: "EUR",
    postedAt: "2026-04-04",
    lang: "en",
    languages: ["Anglais", "Français"],
    tags: ["Commission", "International", "MYS"],
    shortDescription:
      "Brokerage de superyachts 40m+. Réseau client international, présence sur tous les boat shows majeurs.",
    description:
      "Vous rejoignez l'équipe sales de Riviera Yachts pour développer des transactions sur le segment 40m+. Vous chassez, négociez et closez avec l'appui de l'équipe technique et juridique.",
    responsibilities: [
      "Prospection HNW internationale (Europe, US, Moyen-Orient)",
      "Pilotage des transactions de l'origination au closing",
      "Représentation du cabinet sur MYS, FLIBS, Cannes Yachting Festival",
      "Coordination avec surveyors, juristes, capitaines",
    ],
    requirements: [
      "5 ans+ en yachting (broker, charter, management)",
      "Réseau armateurs ou famille office",
      "Anglais bilingue impératif",
      "Mobilité internationale",
    ],
    benefits: [
      "Commission attractive (jusqu'à 200k€ variable)",
      "Voyages internationaux pris en charge",
      "Mutuelle premium",
    ],
    featured: true,
    urgent: true,
  },
  {
    id: "j3",
    slug: "chef-de-rang-michelin",
    title: "Chef de Rang — Restaurant 1*",
    company: byId["c3"],
    type: "CDI",
    level: "Confirmé",
    sector: "Hôtellerie & Restauration",
    location: "Monte-Carlo",
    lat: 43.7406,
    lng: 7.4276,
    remote: "Sur site",
    workTime: "Temps plein",
    salaryMin: 38000,
    salaryMax: 48000,
    currency: "EUR",
    postedAt: "2026-04-05",
    lang: "fr",
    languages: ["Français", "Anglais", "Italien"],
    tags: ["Étoile Michelin", "Logement", "Service haut-de-gamme"],
    shortDescription:
      "Service en salle d'un restaurant 1 étoile Michelin au sein du palace. Logement et repas inclus.",
    description:
      "Au sein de notre restaurant gastronomique étoilé, vous orchestrez le service d'une clientèle internationale exigeante en collaboration avec le maître d'hôtel et le sommelier.",
    responsibilities: [
      "Mise en place et service de votre rang (4-5 tables)",
      "Conseil client et présentation des plats",
      "Coordination cuisine / pâtisserie / bar",
      "Formation des commis",
    ],
    requirements: [
      "3 ans minimum en restauration gastronomique",
      "Expérience étoilée appréciée",
      "Trilingue FR/EN/IT",
      "Présentation impeccable",
    ],
    benefits: [
      "Logement studio fourni",
      "2 repas par service",
      "Pourboire commun",
      "Formation sommellerie",
    ],
  },
  {
    id: "j4",
    slug: "senior-product-engineer",
    title: "Senior Product Engineer — Full-stack TS/Next.js",
    company: byId["c4"],
    type: "CDI",
    level: "Senior",
    sector: "Tech & Digital",
    location: "Fontvieille",
    lat: 43.7290,
    lng: 7.4150,
    remote: "Hybride",
    workTime: "Temps plein",
    salaryMin: 75000,
    salaryMax: 110000,
    currency: "EUR",
    postedAt: "2026-04-06",
    lang: "en",
    languages: ["Français", "Anglais"],
    tags: ["Next.js", "TypeScript", "Supabase", "Stock options"],
    shortDescription:
      "Studio produit qui shippe des SaaS B2B pour le yachting et le luxe. Petite équipe, ownership total.",
    description:
      "On cherche un product engineer senior pour rejoindre une équipe de 8. Tu owneras des features de bout en bout (design → ship → metrics) sur nos produits SaaS utilisés par 400+ clients.",
    responsibilities: [
      "Développement full-stack Next.js / TypeScript / Supabase",
      "Discovery client et itération produit",
      "Mise en production et observabilité",
      "Contribution à la culture ingé (revues, doc, mentoring)",
    ],
    requirements: [
      "5+ ans en product engineering",
      "Maîtrise React, TypeScript, SQL",
      "Sensibilité produit forte",
      "Anglais pro",
    ],
    benefits: [
      "Stock options early stage",
      "MacBook Pro M4 + setup",
      "2j télétravail / semaine",
      "Budget conf 2000€/an",
    ],
    featured: true,
  },
  {
    id: "j5",
    slug: "conseillere-vente-joaillerie",
    title: "Conseiller(ère) de Vente — Haute Joaillerie",
    company: byId["c5"],
    type: "CDI",
    level: "Confirmé",
    sector: "Luxe & Retail",
    location: "Avenue des Beaux-Arts",
    lat: 43.7395,
    lng: 7.4280,
    remote: "Sur site",
    workTime: "Temps plein",
    salaryMin: 42000,
    salaryMax: 70000,
    currency: "EUR",
    postedAt: "2026-04-01",
    lang: "fr",
    languages: ["Français", "Anglais", "Russe"],
    tags: ["Clientèle internationale", "Commission", "Pièces uniques"],
    shortDescription:
      "Vente conseil haute joaillerie pour une clientèle UHNW, principalement russophone et anglophone.",
    description:
      "Vous accompagnez nos clients dans la sélection de pièces de haute joaillerie et créations sur-mesure. Vous fidélisez votre portefeuille et développez la clientèle internationale.",
    responsibilities: [
      "Accueil et conseil client en boutique",
      "Présentation des collections et pièces uniques",
      "Suivi client CRM et relances personnalisées",
      "Participation aux événements clientelle",
    ],
    requirements: [
      "5 ans en vente de luxe (joaillerie, horlogerie, mode)",
      "Trilingue FR/EN, russe ou mandarin apprécié",
      "Maîtrise CRM clientèle",
      "Sens du service irréprochable",
    ],
    benefits: [
      "Commission individuelle",
      "Voyages clients",
      "Mutuelle premium",
      "Tenue fournie",
    ],
  },
  {
    id: "j6",
    slug: "negociateur-immobilier-prestige",
    title: "Négociateur Immobilier de Prestige",
    company: byId["c6"],
    type: "CDI",
    level: "Confirmé",
    sector: "Immobilier",
    location: "Monaco-Ville",
    lat: 43.7311,
    lng: 7.4197,
    remote: "Sur site",
    workTime: "Temps plein",
    salaryMin: 50000,
    salaryMax: 200000,
    currency: "EUR",
    postedAt: "2026-04-03",
    lang: "fr",
    languages: ["Français", "Anglais", "Italien"],
    tags: ["Commission", "Mandats exclusifs", "Voiture de fonction"],
    shortDescription:
      "Mandats exclusifs sur 60 biens d'exception. Commission attractive + voiture de fonction.",
    description:
      "Vous prenez en main une partie de notre portefeuille de mandats exclusifs (penthouses, hôtels particuliers, villas Cap d'Ail). Vous prospectez aussi de nouveaux mandats vendeurs.",
    responsibilities: [
      "Gestion d'un portefeuille de mandats exclusifs",
      "Visites, négociation, closing",
      "Prospection vendeurs / acquéreurs",
      "Reporting hebdomadaire",
    ],
    requirements: [
      "Carte T à jour ou en cours",
      "3 ans+ en immobilier de prestige",
      "Trilingue FR/EN/IT",
      "Permis B exigé",
    ],
    benefits: [
      "Commission attractive (3-5%)",
      "Voiture de fonction haut de gamme",
      "Téléphone, ordinateur",
      "Portefeuille fourni",
    ],
  },
  {
    id: "j7",
    slug: "avocat-droit-affaires",
    title: "Avocat Droit des Affaires — Corporate",
    company: byId["c7"],
    type: "CDI",
    level: "Confirmé",
    sector: "Juridique",
    location: "Boulevard des Moulins",
    lat: 43.7421,
    lng: 7.4290,
    remote: "Sur site",
    workTime: "Temps plein",
    salaryMin: 70000,
    salaryMax: 110000,
    currency: "EUR",
    postedAt: "2026-04-05",
    lang: "en",
    languages: ["Français", "Anglais"],
    tags: ["Corporate", "M&A", "Droit monégasque"],
    shortDescription:
      "Cabinet d'affaires établi. Pratique corporate, M&A, structuration internationale.",
    description:
      "Vous intégrez l'équipe corporate du cabinet pour intervenir sur des opérations de M&A, structuration de groupes internationaux et conseil quotidien aux entreprises monégasques.",
    responsibilities: [
      "Conseil corporate quotidien aux clients du cabinet",
      "Pilotage d'opérations M&A et restructurations",
      "Rédaction de pactes, contrats, statuts",
      "Veille juridique et formation client",
    ],
    requirements: [
      "5 ans+ post barreau, idéalement Monaco / Paris",
      "Maîtrise droit monégasque ou volonté de s'y former",
      "Anglais juridique",
      "Inscription Barreau Monaco souhaitée",
    ],
    benefits: ["Bonus annuel", "Bibliothèque pro", "Formation continue"],
  },
  {
    id: "j8",
    slug: "coach-tennis-enfants",
    title: "Coach Tennis — École de jeunes",
    company: byId["c8"],
    type: "CDI",
    level: "Junior",
    sector: "Sport & Bien-être",
    location: "Roquebrune-Cap-Martin",
    lat: 43.7611,
    lng: 7.4661,
    remote: "Sur site",
    workTime: "Temps plein",
    salaryMin: 32000,
    salaryMax: 42000,
    currency: "EUR",
    postedAt: "2026-04-07",
    lang: "fr",
    languages: ["Français", "Anglais"],
    tags: ["BE/DE Tennis", "École", "Cadre exceptionnel"],
    shortDescription:
      "Encadrement de l'école de tennis enfants (5-15 ans). 28h de cours / semaine.",
    description:
      "Vous encadrez les groupes de notre école de tennis enfants au sein du club historique du Rolex Monte-Carlo Masters.",
    responsibilities: [
      "Cours collectifs et individuels enfants 5-15 ans",
      "Préparation des compétitions",
      "Animation des stages vacances",
      "Suivi pédagogique",
    ],
    requirements: [
      "BE ou DE Tennis exigé",
      "Expérience encadrement enfants",
      "Anglais conversationnel",
      "Pédagogie et patience",
    ],
    benefits: [
      "Accès libre courts en dehors des cours",
      "Repas inclus",
      "Pass Rolex Monte-Carlo Masters",
    ],
  },
];

// ─── Offres complémentaires (génération du mur) ─────────────────────────────
const extraSeed: Array<Partial<Job> & {
  title: string;
  companyId: string;
  type: JobType;
  level: ExperienceLevel;
  sector: Sector;
  location: string;
  postedAt: string;
  lang: Locale;
  shortDescription: string;
}> = [
  { title: "Analyste Crédit Privé", companyId: "c1", type: "CDI", level: "Confirmé", sector: "Banque & Finance", location: "Monaco — Carré d'Or", postedAt: "2026-04-06", lang: "fr", shortDescription: "Analyse de dossiers de financement structuré pour clientèle UHNW. Coordination avec les wealth managers." },
  { title: "Compliance Officer KYC/AML", companyId: "c1", type: "CDI", level: "Senior", sector: "Banque & Finance", location: "Monaco — Carré d'Or", postedAt: "2026-04-04", lang: "en", shortDescription: "Pilotage des contrôles KYC/AML conformes aux exigences SICCFIN. Équipe de 4 personnes." },
  { title: "Stagiaire Asset Management", companyId: "c1", type: "Stage", level: "Junior", sector: "Banque & Finance", location: "Monaco", postedAt: "2026-04-07", lang: "fr", shortDescription: "Stage de 6 mois en gestion d'actifs. École de commerce ou ingé, finance de marché." },
  { title: "Charter Manager", companyId: "c2", type: "CDI", level: "Confirmé", sector: "Yachting", location: "Port Hercule", postedAt: "2026-04-03", lang: "en", shortDescription: "Pilotage de la flotte charter (12 unités 30-60m). Coordination équipages, clients, comptabilité." },
  { title: "Yacht Crew Coordinator", companyId: "c2", type: "CDD", level: "Junior", sector: "Yachting", location: "Port Hercule", postedAt: "2026-04-05", lang: "en", shortDescription: "Recrutement et logistique d'équipages saisonniers (avril–octobre). Réseau crew agencies." },
  { title: "Marketing Manager", companyId: "c2", type: "CDI", level: "Senior", sector: "Yachting", location: "Port Hercule", postedAt: "2026-04-01", lang: "en", shortDescription: "Stratégie de marque, présence sur les boat shows internationaux, contenu B2B HNW." },
  { title: "Réceptionniste Tournant — 5*", companyId: "c3", type: "CDI", level: "Junior", sector: "Hôtellerie & Restauration", location: "Monte-Carlo", postedAt: "2026-04-06", lang: "fr", shortDescription: "Accueil clientèle internationale, check-in/out, conciergerie. Logement studio fourni." },
  { title: "Sous-Chef de Cuisine", companyId: "c3", type: "CDI", level: "Senior", sector: "Hôtellerie & Restauration", location: "Monte-Carlo", postedAt: "2026-04-04", lang: "fr", shortDescription: "Bras droit du Chef sur la brigade gastronomique. Expérience étoilée requise." },
  { title: "Spa Therapist", companyId: "c3", type: "CDI", level: "Confirmé", sector: "Hôtellerie & Restauration", location: "Monte-Carlo", postedAt: "2026-04-02", lang: "en", shortDescription: "Soins signature et rituels au sein d'un spa de 1500m². Anglais requis, italien apprécié." },
  { title: "Concierge Clefs d'Or", companyId: "c3", type: "CDI", level: "Senior", sector: "Hôtellerie & Restauration", location: "Monte-Carlo", postedAt: "2026-04-07", lang: "fr", shortDescription: "Conciergerie haute exigence, clientèle UHNW. Membre Clefs d'Or apprécié." },
  { title: "Designer Produit (UI/UX)", companyId: "c4", type: "CDI", level: "Senior", sector: "Tech & Digital", location: "Fontvieille", postedAt: "2026-04-05", lang: "fr", shortDescription: "Design produit de bout en bout sur nos SaaS B2B yachting. Figma, prototypage, recherche utilisateur." },
  { title: "Data Engineer", companyId: "c4", type: "CDI", level: "Confirmé", sector: "Tech & Digital", location: "Fontvieille", postedAt: "2026-04-03", lang: "en", shortDescription: "Pipelines de données pour 400+ clients. Python, dbt, Postgres. Petite équipe, gros impact." },
  { title: "Freelance Brand Designer", companyId: "c4", type: "Freelance", level: "Senior", sector: "Tech & Digital", location: "Fontvieille", postedAt: "2026-04-06", lang: "en", shortDescription: "Mission de 3 mois sur le rebrand d'un de nos SaaS B2B. Identité, site, design system." },
  { title: "Vendeur(se) Horlogerie", companyId: "c5", type: "CDI", level: "Confirmé", sector: "Luxe & Retail", location: "Avenue des Beaux-Arts", postedAt: "2026-04-02", lang: "fr", shortDescription: "Vente conseil horlogerie haut de gamme. Connaissance des grandes marques exigée." },
  { title: "Responsable Boutique", companyId: "c5", type: "CDI", level: "Manager", sector: "Luxe & Retail", location: "Monte-Carlo", postedAt: "2026-04-04", lang: "fr", shortDescription: "Pilotage d'une équipe de 6 conseillers, KPIs ventes et clientelling. Expérience luxe obligatoire." },
  { title: "Stagiaire Marketing Luxe", companyId: "c5", type: "Stage", level: "Junior", sector: "Luxe & Retail", location: "Monaco", postedAt: "2026-04-07", lang: "fr", shortDescription: "Stage de 6 mois en marketing événementiel pour une maison de joaillerie." },
  { title: "Assistante de Direction", companyId: "c6", type: "CDI", level: "Confirmé", sector: "Immobilier", location: "Monaco-Ville", postedAt: "2026-04-05", lang: "fr", shortDescription: "Assistanat trilingue (FR/EN/IT), agenda dirigeants, coordination des visites." },
  { title: "Property Manager", companyId: "c6", type: "CDI", level: "Senior", sector: "Immobilier", location: "Monaco-Ville", postedAt: "2026-04-01", lang: "en", shortDescription: "Gestion locative haut de gamme : 40 biens en mandat. Relations propriétaires UHNW." },
  { title: "Avocat Junior — Fiscal", companyId: "c7", type: "CDI", level: "Junior", sector: "Juridique", location: "Boulevard des Moulins", postedAt: "2026-04-06", lang: "fr", shortDescription: "1ère expérience en cabinet d'affaires. Fiscalité internationale, structuration patrimoniale." },
  { title: "Paralegal Trilingue", companyId: "c7", type: "CDI", level: "Confirmé", sector: "Juridique", location: "Monaco", postedAt: "2026-04-03", lang: "fr", shortDescription: "Support juridique, recherches, rédaction de documents. FR/EN/IT obligatoire." },
  { title: "Maître-Nageur Sauveteur", companyId: "c8", type: "CDD", level: "Junior", sector: "Sport & Bien-être", location: "Roquebrune-Cap-Martin", postedAt: "2026-04-04", lang: "fr", shortDescription: "Saison été à la piscine du club. BNSSA exigé, CDD avril–septembre." },
  { title: "Préparateur Physique", companyId: "c8", type: "CDI", level: "Confirmé", sector: "Sport & Bien-être", location: "Monte-Carlo", postedAt: "2026-04-02", lang: "fr", shortDescription: "Préparation physique des joueurs juniors. Diplôme STAPS ou équivalent." },
  { title: "Event Manager — Tournois ATP", companyId: "c8", type: "CDD", level: "Senior", sector: "Événementiel", location: "Monte-Carlo", postedAt: "2026-04-07", lang: "en", shortDescription: "Organisation d'événements VIP autour du Rolex Monte-Carlo Masters. CDD 6 mois." },
];

const baseLat = 43.7384;
const baseLng = 7.4246;

const generatedJobs: Job[] = extraSeed.map((s, idx) => {
  const company = byId[s.companyId];
  const slug = s.title
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "") + "-" + (idx + 100);
  return {
    id: `gen-${idx + 1}`,
    slug,
    title: s.title,
    company,
    type: s.type,
    level: s.level,
    sector: s.sector,
    location: s.location,
    lat: baseLat + (idx % 5) * 0.002,
    lng: baseLng + (idx % 5) * 0.002,
    remote: idx % 4 === 0 ? "Hybride" : "Sur site",
    workTime: idx % 7 === 0 ? "Temps partiel" : "Temps plein",
    salaryMin: undefined,
    salaryMax: undefined,
    currency: "EUR" as const,
    postedAt: s.postedAt,
    lang: s.lang,
    languages: s.lang === "en" ? ["Anglais", "Français"] : ["Français", "Anglais"],
    tags: [],
    shortDescription: s.shortDescription,
    description: s.shortDescription,
    responsibilities: [],
    requirements: [],
    benefits: [],
    featured: idx % 11 === 0,
  };
});

// On expose la liste complète (offres rédigées + offres générées).
export const allJobs: Job[] = [...jobs, ...generatedJobs];

export function getJob(slug: string): Job | undefined {
  return allJobs.find((j) => j.slug === slug);
}

export function getCompany(slug: string): Company | undefined {
  return companies.find((c) => c.slug === slug);
}

export function formatSalary(job: Job): string | null {
  if (!job.salaryMin && !job.salaryMax) return null;
  const fmt = (n: number) =>
    n >= 1000 ? `${Math.round(n / 1000)}k` : `${n}`;
  if (job.salaryMin && job.salaryMax) {
    return `${fmt(job.salaryMin)}–${fmt(job.salaryMax)} €`;
  }
  return `${fmt((job.salaryMin || job.salaryMax)!)} €`;
}

export function relativeDate(iso: string): string {
  const d = new Date(iso);
  const now = new Date("2026-04-08");
  const diff = Math.round((now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24));
  if (diff <= 0) return "Aujourd'hui";
  if (diff === 1) return "Hier";
  if (diff < 7) return `Il y a ${diff} jours`;
  if (diff < 30) return `Il y a ${Math.round(diff / 7)} sem.`;
  return `Il y a ${Math.round(diff / 30)} mois`;
}

/**
 * Mapping niveau d'expérience interne → bucket filtre.
 */
export function experienceMatches(
  level: ExperienceLevel,
  bucket: ExperienceBucket,
): boolean {
  switch (bucket) {
    case "debutant":
      return level === "Junior";
    case "1-3":
      return level === "Confirmé";
    case "3-5":
      return level === "Senior";
    case "5+":
      return level === "Manager" || level === "Direction";
  }
}

/**
 * Nombre de jours écoulés depuis la publication, basé sur la date de
 * référence du mock (08/04/2026).
 */
export function daysSincePosted(iso: string): number {
  const d = new Date(iso);
  const now = new Date("2026-04-08");
  return Math.max(
    0,
    Math.round((now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24)),
  );
}

/**
 * Compte les jobs ouverts pour chaque entreprise.
 */
export function jobCountByCompany(): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const j of allJobs) {
    counts[j.company.id] = (counts[j.company.id] ?? 0) + 1;
  }
  return counts;
}

/**
 * Renvoie les offres ouvertes d'une entreprise donnée, triées par date.
 */
export function jobsForCompany(companyId: string): Job[] {
  return allJobs
    .filter((j) => j.company.id === companyId)
    .sort((a, b) => b.postedAt.localeCompare(a.postedAt));
}

/**
 * Trouve des offres similaires à `job` : on prend d'abord les offres
 * de la même entreprise (hors la fiche courante), puis on complète avec
 * d'autres offres du même secteur. Retourne au plus `limit` résultats.
 */
export function similarJobs(job: Job, limit = 3): Job[] {
  const sameCompany = allJobs.filter(
    (j) => j.id !== job.id && j.company.id === job.company.id,
  );
  const sameSector = allJobs.filter(
    (j) =>
      j.id !== job.id &&
      j.company.id !== job.company.id &&
      j.sector === job.sector,
  );
  return [...sameCompany, ...sameSector].slice(0, limit);
}

/**
 * Compte les jobs par secteur (utilisé dans les filtres pour afficher les
 * counts à côté de chaque case).
 */
export function jobCountBySector(): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const j of jobs) {
    counts[j.sector] = (counts[j.sector] ?? 0) + 1;
  }
  return counts;
}

/**
 * Palette restreinte de 8 couleurs éditoriales utilisées comme fine barre
 * verticale 3px à gauche des cartes d'offres. Toutes désaturées, sourdes,
 * dans la lignée Monocle / Robb Report. Aucune n'est vive.
 */
export const COMPANY_BAR_PALETTE = [
  "#1C3D5A", // bleu d'encre (accent)
  "#5A2A2A", // oxblood
  "#2F4F3F", // forêt
  "#6B4423", // tabac
  "#4A3D5A", // crépuscule
  "#5A4A2A", // moutarde sombre
  "#2A4A5A", // acier
  "#4A2A4A", // prune
] as const;

/**
 * Couleur déterministe (palette de 8) pour une entreprise donnée, dérivée de
 * son id. Utilisée pour la barre verticale 3px sur les cartes d'offres.
 */
export function companyBarColor(companyId: string): string {
  let h = 0;
  for (let i = 0; i < companyId.length; i++) {
    h = (h * 31 + companyId.charCodeAt(i)) | 0;
  }
  return COMPANY_BAR_PALETTE[Math.abs(h) % COMPANY_BAR_PALETTE.length];
}

/**
 * Couleur de tuile pour les secteurs (section "Explorer par secteur").
 * Mêmes 8 teintes que la palette des barres entreprises, distribuées
 * de façon déterministe.
 */
export function sectorTileColor(sectorName: string): string {
  let h = 0;
  for (let i = 0; i < sectorName.length; i++) {
    h = (h * 31 + sectorName.charCodeAt(i)) | 0;
  }
  return COMPANY_BAR_PALETTE[Math.abs(h) % COMPANY_BAR_PALETTE.length];
}
