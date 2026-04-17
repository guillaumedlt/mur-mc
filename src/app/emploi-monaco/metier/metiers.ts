/**
 * Catalogue des metiers Monaco pour les landing pages SEO programmatiques.
 *
 * Chaque entree genere une page /emploi-monaco/metier/[slug] avec un title,
 * une description unique et un filtre sur les offres publiees.
 *
 * `match` = mots-cles cherches dans job.title (case-insensitive, OR).
 * On garde volontairement des synonymes larges pour maximiser le matching.
 */

export type MetierDef = {
  slug: string;
  label: string;
  /** Mots-cles pour matcher les titres de jobs (OR, case-insensitive) */
  match: string[];
  description: string;
  sector: string;
  /** Fourchette salariale indicative annuelle brute (EUR). Affiché sur la page. */
  salaryRange?: string;
  /** Conseil court pour les candidats (1-2 phrases, affiché sous les offres). */
  tip?: string;
};

export const METIERS: MetierDef[] = [
  // ─── Banque & Finance ────────────────────────────────
  { slug: "comptable", label: "Comptable", match: ["comptab", "accounting"], description: "Offres de comptable a Monaco : comptabilite generale, auxiliaire, cabinet. Banques privees, family offices, holdings.", sector: "Banque & Finance", salaryRange: "35 000 — 55 000 EUR", tip: "Le bilinguisme FR/EN est quasi-obligatoire. Les certifications (DCG, DSCG) sont un vrai plus pour les postes en banque privee." },
  { slug: "analyste-financier", label: "Analyste financier", match: ["analyste financ", "financial analyst", "analyste credit"], description: "Postes d'analyste financier a Monaco : analyse credit, risques, marche. Banques privees et fonds d'investissement.", sector: "Banque & Finance" },
  { slug: "gestionnaire-de-patrimoine", label: "Gestionnaire de patrimoine", match: ["patrimoine", "wealth", "private bank"], description: "Emploi gestionnaire de patrimoine a Monaco : wealth management, UHNW, private banking. 32 banques sur 2 km2.", sector: "Banque & Finance", salaryRange: "60 000 — 120 000 EUR + bonus", tip: "Un carnet d'adresses UHNW et une certification CFA ou CIWM font la difference. Monaco valorise la discretion et la fidelite client." },
  { slug: "compliance-officer", label: "Compliance Officer", match: ["compliance", "conformite", "lcb", "aml", "kyc"], description: "Postes compliance a Monaco : LCB/FT, KYC/AML, SICCFIN, conformite bancaire. Forte demande en Principaute.", sector: "Banque & Finance", salaryRange: "50 000 — 90 000 EUR", tip: "La connaissance de la reglementation SICCFIN et de la Loi 1.362 est un atout decisif a Monaco. Les profils ACAMS sont tres recherches." },
  { slug: "controleur-de-gestion", label: "Controleur de gestion", match: ["controleur de gestion", "controle de gestion", "controller"], description: "Offres de controleur de gestion a Monaco : reporting, budget, analyse. Holdings, groupes hoteliers, banques.", sector: "Banque & Finance" },
  { slug: "tresorier", label: "Tresorier", match: ["tresor", "treasury"], description: "Emploi tresorier a Monaco : gestion de tresorerie, cash management, banques et corporate.", sector: "Banque & Finance" },
  { slug: "auditeur", label: "Auditeur", match: ["audit", "commissaire aux comptes"], description: "Postes d'auditeur a Monaco : audit interne, externe, commissariat aux comptes. Cabinets et groupes.", sector: "Banque & Finance" },

  // ─── Hotellerie & Restauration ───────────────────────
  { slug: "chef-de-rang", label: "Chef de rang", match: ["chef de rang", "maitre d'hotel"], description: "Emploi chef de rang a Monaco : palaces 5 etoiles, restaurants etoiles Michelin, Hotel de Paris, Hermitage.", sector: "Hotellerie", salaryRange: "28 000 — 38 000 EUR + pourboires", tip: "L'experience en palace ou restaurant etoile est un pre-requis. Le francais, l'anglais et l'italien sont les 3 langues cles a Monaco." },
  { slug: "receptionniste", label: "Receptionniste", match: ["receptionniste", "receptionist", "front desk", "front office"], description: "Offres de receptionniste a Monaco : accueil palace, concierge, front office hotellerie de luxe.", sector: "Hotellerie" },
  { slug: "chef-cuisinier", label: "Chef cuisinier", match: ["chef cuisinier", "chef de cuisine", "sous-chef", "chef patissier", "head chef"], description: "Emploi chef cuisinier a Monaco : cuisine gastronomique, etoilee, restaurants de palace. Alain Ducasse, Le Louis XV.", sector: "Hotellerie" },
  { slug: "concierge", label: "Concierge", match: ["concierge", "guest relation"], description: "Postes de concierge a Monaco : concierge de palace, guest relations, services VIP. Cles d'Or.", sector: "Hotellerie" },
  { slug: "barman", label: "Barman", match: ["barman", "bartender", "mixolog"], description: "Offres de barman a Monaco : bars de palace, rooftops, lounges. Mixologie haut de gamme.", sector: "Hotellerie" },
  { slug: "gouvernante", label: "Gouvernante", match: ["gouvernante", "housekeeper", "housekeeping"], description: "Emploi gouvernante a Monaco : housekeeping palace, villas privees, yachts de luxe.", sector: "Hotellerie" },
  { slug: "directeur-hotel", label: "Directeur d'hotel", match: ["directeur hotel", "directeur general hotel", "general manager hotel", "hotel manager"], description: "Postes de direction hoteliere a Monaco : DG palace, directeur hebergement, F&B manager.", sector: "Hotellerie" },
  { slug: "sommelier", label: "Sommelier", match: ["sommelier", "wine"], description: "Offres de sommelier a Monaco : restaurants etoiles, palaces, caves a vins prestige.", sector: "Hotellerie" },
  { slug: "serveur", label: "Serveur", match: ["serveur", "serveuse", "waiter"], description: "Emploi serveur a Monaco : restauration haut de gamme, brunch, room service palace.", sector: "Hotellerie" },

  // ─── Yachting ────────────────────────────────────────
  { slug: "capitaine-yacht", label: "Capitaine de yacht", match: ["capitaine", "captain", "skipper"], description: "Emploi capitaine de yacht a Monaco : superyachts 40m+, Port Hercule, navigation Mediterranee.", sector: "Yachting", salaryRange: "60 000 — 150 000 EUR (selon tonnage)", tip: "Le certificat MCA Master 3000gt est le standard minimum pour les superyachts. L'experience Mediterranee + Caraibes est tres valorisee." },
  { slug: "stewardess-yacht", label: "Stewardess yacht", match: ["stewardess", "steward", "chief stew"], description: "Postes de stewardess a Monaco : service VIP a bord, yachts de luxe, saisons Mediterranee.", sector: "Yachting" },
  { slug: "ingenieur-naval", label: "Ingenieur naval", match: ["ingenieur naval", "naval architect", "marine engineer"], description: "Offres d'ingenieur naval a Monaco : construction, refit, design de superyachts.", sector: "Yachting" },
  { slug: "mecanicien-yacht", label: "Mecanicien yacht", match: ["mecanicien", "engineer yacht", "electro"], description: "Emploi mecanicien yacht a Monaco : moteurs, systemes electriques, maintenance a bord.", sector: "Yachting" },
  { slug: "broker-yacht", label: "Broker yacht", match: ["broker", "brokerage", "yacht sales"], description: "Postes de broker yachting a Monaco : vente, location, charter de superyachts.", sector: "Yachting" },

  // ─── Luxe & Retail ───────────────────────────────────
  { slug: "vendeur-luxe", label: "Vendeur luxe", match: ["vendeur", "vendeuse", "conseiller vente", "sales advisor", "retail"], description: "Emploi vendeur luxe a Monaco : joaillerie, horlogerie, pret-a-porter. Carre d'Or, boutiques Chanel, Dior, Hermes.", sector: "Luxe & Retail", salaryRange: "28 000 — 45 000 EUR + commissions", tip: "La presentation impeccable et le multilinguisme (russe, arabe en bonus) sont decisifs. Les maisons recherchent des profils stables." },
  { slug: "directeur-boutique", label: "Directeur de boutique", match: ["directeur boutique", "store manager", "responsable boutique"], description: "Postes de directeur de boutique a Monaco : management retail luxe, objectifs CA, experience client VIP.", sector: "Luxe & Retail" },
  { slug: "visual-merchandiser", label: "Visual merchandiser", match: ["visual merchandis", "etalagiste", "merchandising"], description: "Offres de visual merchandiser a Monaco : mise en scene vitrines luxe, merchandising horlogerie/joaillerie.", sector: "Luxe & Retail" },
  { slug: "personal-shopper", label: "Personal shopper", match: ["personal shopper", "personal styl"], description: "Emploi personal shopper a Monaco : clientele UHNW, stylisme prive, luxury concierge.", sector: "Luxe & Retail" },

  // ─── Tech & Digital ──────────────────────────────────
  { slug: "developpeur", label: "Developpeur", match: ["developpeur", "developer", "engineer", "fullstack", "frontend", "backend"], description: "Offres de developpeur a Monaco : frontend, backend, fullstack. React, Node, Python. Fintech, healthtech, SaaS.", sector: "Tech & Digital", salaryRange: "45 000 — 85 000 EUR", tip: "Les fintechs monegasques (Finopia, Temenos) et MonacoTech recrutent activement. Le remote partiel est de plus en plus accepte." },
  { slug: "chef-de-projet", label: "Chef de projet", match: ["chef de projet", "project manager", "product owner", "scrum master"], description: "Emploi chef de projet a Monaco : gestion de projet tech, digital, transformation. Methodes agiles.", sector: "Tech & Digital" },
  { slug: "data-analyst", label: "Data analyst", match: ["data analyst", "data scien", "business intelligence", "bi analyst"], description: "Postes de data analyst a Monaco : analyse de donnees, BI, machine learning. Banques, e-commerce, sport.", sector: "Tech & Digital" },
  { slug: "devops", label: "DevOps", match: ["devops", "sre", "infrastructure", "cloud engineer"], description: "Offres DevOps a Monaco : AWS, GCP, Kubernetes, CI/CD. Fintech et startups MonacoTech.", sector: "Tech & Digital" },
  { slug: "designer-ux", label: "Designer UX/UI", match: ["designer", "ux", "ui", "product design"], description: "Emploi designer UX/UI a Monaco : product design, interface, prototypage. Luxe digital, fintech.", sector: "Tech & Digital" },
  { slug: "cybersecurite", label: "Cybersecurite", match: ["cybersecurite", "security", "infosec", "pentester"], description: "Postes en cybersecurite a Monaco : RSSI, pentester, SOC analyst. Banques, gouvernement, yachting.", sector: "Tech & Digital" },

  // ─── Immobilier ──────────────────────────────────────
  { slug: "agent-immobilier", label: "Agent immobilier", match: ["agent immobilier", "negociateur", "real estate"], description: "Emploi agent immobilier a Monaco : transactions prestige, 50 000 EUR/m2, clientele UHNW.", sector: "Immobilier" },
  { slug: "gestionnaire-immobilier", label: "Gestionnaire immobilier", match: ["gestionnaire immobilier", "property manager", "syndic"], description: "Offres de gestionnaire immobilier a Monaco : gestion locative, copropriete, syndic de prestige.", sector: "Immobilier" },

  // ─── Juridique ───────────────────────────────────────
  { slug: "avocat", label: "Avocat", match: ["avocat", "lawyer", "attorney", "juriste"], description: "Emploi avocat a Monaco : droit des affaires, fiscalite internationale, droit immobilier, trusts.", sector: "Juridique", salaryRange: "55 000 — 120 000 EUR (collaborateur)", tip: "Le Barreau de Monaco est distinct du Barreau francais. Les cabinets recherchent des profils bilingues avec une specialite en droit international prive." },
  { slug: "secretaire-juridique", label: "Secretaire juridique", match: ["secretaire juridique", "legal assistant", "paralegal"], description: "Postes de secretaire juridique a Monaco : cabinets d'avocats, etudes notariales, compliance.", sector: "Juridique" },
  { slug: "notaire", label: "Notaire / Clerc", match: ["notaire", "clerc", "notarial"], description: "Offres de notaire et clerc a Monaco : actes immobiliers, successions, droit monegasque.", sector: "Juridique" },

  // ─── Support / Transversal ───────────────────────────
  { slug: "assistant-de-direction", label: "Assistant de direction", match: ["assistant de direction", "executive assistant", "office manager", "assistante"], description: "Emploi assistant de direction a Monaco : support DG, family office, holding. Bilingue FR/EN.", sector: "Transversal" },
  { slug: "secretaire", label: "Secretaire", match: ["secretaire", "secretary", "assistante admin"], description: "Offres de secretaire a Monaco : secretariat medical, juridique, de direction. Bilingue requis.", sector: "Transversal" },
  { slug: "ressources-humaines", label: "Responsable RH", match: ["ressources humaines", "rh", "drh", "human resources", "talent"], description: "Emploi RH a Monaco : DRH, responsable recrutement, talent manager. Droit social monegasque.", sector: "Transversal" },
  { slug: "commercial", label: "Commercial", match: ["commercial", "business develop", "sales", "account manager"], description: "Postes de commercial a Monaco : vente B2B, business development, key account. Luxe, finance, tech.", sector: "Transversal" },
  { slug: "marketing", label: "Marketing", match: ["marketing", "growth", "community manager", "social media"], description: "Offres marketing a Monaco : digital marketing, SEO, social media, branding luxe. Agences et annonceurs.", sector: "Transversal" },
  { slug: "communication", label: "Charge de communication", match: ["communication", "relations publiques", "pr", "press"], description: "Emploi communication a Monaco : relations presse, evenementiel, RP luxe. Palais Princier, SBM, marques.", sector: "Transversal" },
  { slug: "chauffeur", label: "Chauffeur prive", match: ["chauffeur", "driver"], description: "Offres de chauffeur prive a Monaco : VTC de prestige, family office, yacht owner. Permis VTC requis.", sector: "Transversal" },
  { slug: "nanny", label: "Nanny / Gouvernante d'enfants", match: ["nanny", "nounou", "gouvernante enfants", "childcare"], description: "Emploi nanny a Monaco : garde d'enfants UHNW, bilingue, voyages internationaux.", sector: "Transversal" },
  { slug: "majordome", label: "Majordome", match: ["majordome", "butler", "household manager"], description: "Postes de majordome a Monaco : gestion de residence privee, villa, yacht. Service VIP.", sector: "Transversal" },
  { slug: "infirmier", label: "Infirmier", match: ["infirmier", "infirmiere", "nurse", "ide"], description: "Offres d'infirmier a Monaco : Centre Hospitalier Princesse Grace, cliniques privees, soins a domicile.", sector: "Transversal" },
  { slug: "medecin", label: "Medecin", match: ["medecin", "docteur", "physician", "praticien"], description: "Emploi medecin a Monaco : CHPG, cabinets prives, medecine du sport, medecine esthetique.", sector: "Transversal" },
  { slug: "architecte", label: "Architecte", match: ["architecte", "architect"], description: "Postes d'architecte a Monaco : projets prestige, extension en mer, renovation palace.", sector: "Transversal" },
  { slug: "electricien", label: "Electricien", match: ["electricien", "electrician", "electrotechn"], description: "Offres d'electricien a Monaco : chantiers de luxe, yachts, maintenance immeuble prestige.", sector: "BTP" },
  { slug: "plombier", label: "Plombier", match: ["plombier", "plumber", "chauffagiste"], description: "Emploi plombier a Monaco : installations haut de gamme, maintenance immeuble, chantiers prestige.", sector: "BTP" },
];

export const METIER_SLUGS = METIERS.map((m) => m.slug);
