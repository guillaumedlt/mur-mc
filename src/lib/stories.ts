/**
 * Articles éditoriaux du magazine Mur.mc.
 * Mock pour l'instant ; à brancher sur Supabase ou un CMS plus tard.
 */

export type StoryCategory =
  | "Marché"
  | "Métier"
  | "Profil"
  | "Coulisses"
  | "Données";

export type Story = {
  id: string;
  slug: string;
  category: StoryCategory;
  title: string;
  /** Résumé (lead) — utilisé en méta-description et accroche carte. */
  excerpt: string;
  /** Phrase d'accroche en italique au sommet de l'article. */
  lead: string;
  /** Corps de l'article : paragraphes successifs. */
  body: Array<
    | { type: "p"; text: string }
    | { type: "h2"; text: string }
    | { type: "quote"; text: string; author?: string }
  >;
  authorName: string;
  authorRole: string;
  publishedAt: string; // ISO
  updatedAt?: string;
  readingMinutes: number;
  /** Vedette = mise en avant en hero du magazine. */
  featured?: boolean;
  /** Tags secondaires pour la recherche SEO interne. */
  tags: string[];
};

/** URL stable picsum.photos seedée par story (pas d'API key). */
export function storyCover(story: Story, w = 1600, h = 900): string {
  return `https://picsum.photos/seed/story-${story.slug}/${w}/${h}`;
}

export const stories: Story[] = [
  {
    id: "s1",
    slug: "pourquoi-monaco-recrute-en-silence",
    category: "Marché",
    title: "Pourquoi Monaco recrute en silence",
    excerpt:
      "La Principauté affiche officiellement 0,4 % de chômage. Et pourtant, derrière les portes des banques privées et des palaces, c'est la bataille pour les talents qui domine 2026.",
    lead:
      "0,4 % de chômage officiel. Officieusement, c'est la guerre des talents. Plongée dans un marché qui ne dit jamais son nom.",
    body: [
      {
        type: "p",
        text: "Monaco ne ressemble à aucun autre marché de l'emploi européen. 39 000 habitants, 60 000 emplois, et un tissu économique concentré sur cinq secteurs : la banque privée, le yachting, la haute hôtellerie, le luxe et — depuis dix ans — la tech. Tout le monde se connaît, les recruteurs s'échangent les CV par WhatsApp, et la majorité des postes se ferment avant même d'être publiés.",
      },
      {
        type: "h2",
        text: "Un marché caché, mais pas inactif",
      },
      {
        type: "p",
        text: "C'est précisément cette opacité qui crée la difficulté. Les jeunes diplômés français ou italiens qui rêvent du Rocher ne savent pas par où commencer. Les expatriés qui posent leurs valises dans un palace à Monte-Carlo ne savent pas quelles maisons cherchent un chef de rang trilingue. Les développeurs freelance ignorent que Monaco Telecom recrute en continu pour son entité B2B.",
      },
      {
        type: "p",
        text: "Le résultat : un marché à deux vitesses. D'un côté, les initiés qui tournent entre les mêmes vingt employeurs depuis quinze ans. De l'autre, des centaines de candidats qualifiés qui frappent à la mauvaise porte.",
      },
      {
        type: "quote",
        text: "À Monaco, on ne cherche pas un job, on l'attend. Et c'est exactement ce qu'on veut casser.",
        author: "Sarah B., directrice RH d'un cabinet d'avocats monégasque",
      },
      {
        type: "h2",
        text: "Ce qui change en 2026",
      },
      {
        type: "p",
        text: "Trois forces convergent. D'abord, les départs massifs à la retraite des baby-boomers monégasques qui dirigent les structures historiques. Ensuite, l'arrivée de fonds d'investissement étrangers qui imposent des standards de transparence. Enfin, la pression des jeunes talents européens qui refusent désormais de candidater à des postes invisibles.",
      },
      {
        type: "p",
        text: "Conséquence : pour la première fois depuis vingt ans, les grandes maisons monégasques publient leurs offres en clair. C'est exactement ce moment que Mur.mc cherche à capter — pour redonner aux candidats la lisibilité qu'ils méritent.",
      },
    ],
    authorName: "Léa Martinez",
    authorRole: "Rédactrice en chef",
    publishedAt: "2026-04-02",
    readingMinutes: 6,
    featured: true,
    tags: ["marché", "tendances", "recrutement", "Monaco"],
  },
  {
    id: "s2",
    slug: "coulisses-recrutement-hotel-de-paris",
    category: "Coulisses",
    title: "Dans les coulisses du recrutement à l'Hôtel de Paris",
    excerpt:
      "Le palace historique de Monte-Carlo recrute 80 personnes par an. Trois jours d'entretiens, six langues exigées, et un test surprise au room service. Reportage.",
    lead:
      "Un test surprise au room service, six langues exigées, et 80 recrutements par an. Visite guidée d'une machine à embaucher unique.",
    body: [
      {
        type: "p",
        text: "Il est 9 h 12 quand Camille, candidate au poste de chef de rang, franchit les portes en bois sculpté de l'Hôtel de Paris Monte-Carlo. Devant elle : trois jours de tests, six entretiens, et l'évaluation la plus exigeante de toute l'industrie hôtelière française.",
      },
      {
        type: "h2",
        text: "Un processus en trois actes",
      },
      {
        type: "p",
        text: "Premier acte : une présentation devant le directeur de salle, en français puis en anglais. Deuxième acte : un test pratique sur le terrain, à servir de vrais clients d'un des restaurants étoilés du palace. Troisième acte : une mise en situation impromptue — gérer une réclamation client en italien.",
      },
      {
        type: "p",
        text: "Sur les 200 candidats reçus chaque année, seuls 80 décrochent un contrat. Le taux de transformation est sévère, mais les heureux élus rejoignent l'une des écoles hôtelières les plus respectées du monde.",
      },
      {
        type: "quote",
        text: "On ne recrute pas un poste. On recrute un talent qu'on va garder dix ans.",
        author: "Pierre L., directeur des ressources humaines",
      },
    ],
    authorName: "Nicolas Briand",
    authorRole: "Reporter",
    publishedAt: "2026-03-28",
    readingMinutes: 5,
    tags: ["hôtellerie", "palaces", "SBM", "coulisses"],
  },
  {
    id: "s3",
    slug: "yachting-secteur-en-tension",
    category: "Métier",
    title: "Le yachting cherche ses talents : portrait d'un secteur en tension",
    excerpt:
      "La saison Méditerranée 2026 démarre avec un trou de 1 200 postes non pourvus, principalement sur les unités 40 m+. Ce que ça révèle.",
    lead:
      "1 200 postes non pourvus pour la saison 2026. Le yachting méditerranéen vit sa pire pénurie depuis dix ans.",
    body: [
      {
        type: "p",
        text: "Avril marque chaque année le coup d'envoi de la saison méditerranéenne pour les superyachts. Cette année, les armateurs et brokers monégasques font face à un constat brutal : il manque 1 200 marins, ingénieurs et personnels de bord pour faire tourner la flotte.",
      },
      {
        type: "h2",
        text: "Pourquoi cette pénurie ?",
      },
      {
        type: "p",
        text: "Trois facteurs se combinent. La pandémie a éloigné durablement les jeunes des métiers maritimes. Les conditions de travail — rythme intense, vie embarquée six mois par an — peinent à séduire la génération Z. Et les salaires, longtemps généreux, ont été rattrapés par l'inflation européenne.",
      },
      {
        type: "p",
        text: "Résultat : Edmiston, Camper & Nicholsons et leurs concurrents recrutent désormais à l'année, avec des packages plus attractifs et — fait nouveau — des contrats à terre pour ceux qui ne veulent plus naviguer.",
      },
    ],
    authorName: "Léa Martinez",
    authorRole: "Rédactrice en chef",
    publishedAt: "2026-03-25",
    readingMinutes: 4,
    tags: ["yachting", "Edmiston", "saison", "marché"],
  },
  {
    id: "s4",
    slug: "salaires-palaces-2026",
    category: "Données",
    title: "Salaires 2026 : ce que paient vraiment les palaces de Monaco",
    excerpt:
      "Données inédites sur 18 postes clés en hôtellerie monégasque, de réceptionniste à directeur d'hébergement. Avec logement, sans logement, et la part variable.",
    lead:
      "Réceptionniste, chef de rang, gouvernante, directeur d'hébergement : enquête sur les vraies grilles 2026 dans les palaces monégasques.",
    body: [
      {
        type: "p",
        text: "Mur.mc a interrogé sept palaces 5* monégasques et anonymisé les fourchettes salariales. Voici ce qu'il faut retenir.",
      },
      {
        type: "h2",
        text: "Réception : entre 32 et 42 k€",
      },
      {
        type: "p",
        text: "Un réceptionniste tournant débute autour de 32 k€ bruts annuels, avec logement studio fourni, deux repas par service, et une mutuelle premium. Un chef de réception expérimenté monte à 55 k€, sans logement.",
      },
      {
        type: "h2",
        text: "Salle et service : la prime à l'étoile",
      },
      {
        type: "p",
        text: "Travailler dans un restaurant 1* Michelin permet d'ajouter 8 à 12 k€ par rapport à un poste équivalent en brasserie classique. Le pourboire commun, lui, peut représenter jusqu'à 20 % du salaire annuel pour un chef de rang d'établissement étoilé.",
      },
    ],
    authorName: "Marc Dujardin",
    authorRole: "Data journalist",
    publishedAt: "2026-03-20",
    readingMinutes: 7,
    tags: ["salaires", "données", "hôtellerie", "transparence"],
  },
  {
    id: "s5",
    slug: "tech-monaco-entretien-ceo",
    category: "Profil",
    title: "« Monaco peut devenir le hub tech de la Méditerranée »",
    excerpt:
      "Entretien avec le CEO d'un studio produit fontvieillois qui a passé son équipe de 3 à 28 personnes en deux ans. Stratégie, recrutement, plafond.",
    lead:
      "De 3 à 28 développeurs en 24 mois. Sans levée de fonds. Voilà comment.",
    body: [
      {
        type: "p",
        text: "Quand Antoine R. a fondé son studio en 2022 dans un bureau de 40 m² à Fontvieille, personne ne misait sur la tech monégasque. Aujourd'hui, son équipe shippe quatre SaaS B2B utilisés par 400+ clients en Europe.",
      },
      {
        type: "h2",
        text: "Recruter sans levée",
      },
      {
        type: "p",
        text: "« On ne paye pas les salaires de Paris ou Berlin », reconnaît-il. « Mais on offre quelque chose qu'aucune licorne ne peut offrir : une équipe de 8 seniors qui décident ensemble, des clients réels qui paient, et un cadre de vie qui change tout. »",
      },
      {
        type: "quote",
        text: "Notre meilleur recruteur, c'est le balcon du bureau. Tu vois la mer, tu signes.",
        author: "Antoine R., CEO",
      },
    ],
    authorName: "Léa Martinez",
    authorRole: "Rédactrice en chef",
    publishedAt: "2026-03-18",
    readingMinutes: 6,
    tags: ["tech", "fontvieille", "entretien", "startup"],
  },
  {
    id: "s6",
    slug: "effet-grand-prix-recrutement",
    category: "Marché",
    title: "L'effet Grand Prix : ce que la F1 change au recrutement monégasque",
    excerpt:
      "Chaque mois de mai, la Principauté double sa population active en quinze jours. Comment palaces et restaurants gèrent ce pic — et ce qu'on peut en apprendre.",
    lead:
      "+15 000 personnes en deux semaines. Le Grand Prix est aussi un cas d'école RH unique au monde.",
    body: [
      {
        type: "p",
        text: "Mi-mai, Monaco bascule. Les rues se transforment en circuit, les yachts s'amarrent par dizaines, et la population active double — littéralement — en l'espace de quinze jours. Pour les directeurs d'établissement, c'est le pic absolu de l'année.",
      },
      {
        type: "h2",
        text: "Une saisonnalité ultra-condensée",
      },
      {
        type: "p",
        text: "Là où la côte d'Azur étale ses recrutements saisonniers d'avril à octobre, Monaco les concentre sur trois semaines. Un palace embauche ainsi 50 extras pour le seul week-end du Grand Prix : sécurité, voiturier, runner, hôte ou hôtesse VIP. Le recrutement commence dès janvier.",
      },
    ],
    authorName: "Nicolas Briand",
    authorRole: "Reporter",
    publishedAt: "2026-03-15",
    readingMinutes: 5,
    tags: ["Grand Prix", "F1", "saisonnier", "événementiel"],
  },
  {
    id: "s7",
    slug: "compliance-officer-monaco-guide",
    category: "Métier",
    title: "Devenir compliance officer à Monaco : le guide complet",
    excerpt:
      "Le poste le plus demandé de la place financière monégasque en 2026. Compétences, salaires, parcours, et réalité du job. Ce que personne ne te dit.",
    lead:
      "Le poste le plus chassé de la place financière. Voici comment y arriver — et à quoi ressemble vraiment la journée.",
    body: [
      {
        type: "p",
        text: "Avec le renforcement de la réglementation SICCFIN et la pression internationale sur les flux financiers offshore, le compliance officer est devenu la fonction-clé de toute banque privée monégasque. Et la demande dépasse largement l'offre.",
      },
      {
        type: "h2",
        text: "Les trois compétences indispensables",
      },
      {
        type: "p",
        text: "Maîtrise du droit monégasque LCB-FT (loi 1.362). Anglais juridique courant, idéalement italien. Et — c'est le critère discriminant — une vraie expérience opérationnelle des contrôles KYC sur clientèle UHNW.",
      },
    ],
    authorName: "Léa Martinez",
    authorRole: "Rédactrice en chef",
    publishedAt: "2026-03-10",
    readingMinutes: 8,
    tags: ["compliance", "finance", "guide", "métier"],
  },
];

export function getStory(slug: string): Story | undefined {
  return stories.find((s) => s.slug === slug);
}

export function relatedStories(story: Story, limit = 3): Story[] {
  return stories
    .filter((s) => s.id !== story.id && s.category === story.category)
    .concat(stories.filter((s) => s.id !== story.id && s.category !== story.category))
    .slice(0, limit);
}

export function formatStoryDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}
