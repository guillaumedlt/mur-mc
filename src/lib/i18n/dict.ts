import type { Locale } from "./config";

const dictionaries = {
  fr: {
    nav: {
      jobs: "Offres",
      companies: "Entreprises",
      signin: "Se connecter",
      signup: "Créer un compte",
      postJob: "Recruter",
      about: "À propos",
    },
    home: {
      title1: "Votre prochain job",
      title2: "est à",
      titleHighlight: "Monaco",
      subtitle:
        "Le job board de la Principauté. Banque, yachting, hôtellerie, tech, luxe — toutes les opportunités au même endroit.",

      // Section 2 — Liste des offres
      latestEyebrow: "Dernières offres",
      jobsCount: (n: number) => `${n} offres`,
      seeAll: "Voir tout",
      seeAllJobs: "Voir toutes les offres",

      // Section 3 — Secteurs
      bySectorEyebrow: "Par secteur",

      // Section 4 — Entreprises
      hiringEyebrow: "Elles recrutent en ce moment",
      seeAllCompanies: "Voir toutes les entreprises",

      // Section 5 — Alerte email
      alertTitle: "Recevez les nouvelles offres par email.",
      alertDesc:
        "Un seul email par semaine, les offres qui correspondent à vos critères.",
      alertEmailPlaceholder: "Votre email",
      alertSubmit: "S'abonner",
    },
    search: {
      keyword: "Métier, compétence ou mot-clé",
      sector: "Tous les univers",
      submit: "Rechercher",
    },
    jobs: {
      heroEyebrow: "Annuaire des opportunités",
      heroTitle: (n: number) => `${n} offre${n > 1 ? "s" : ""} en Principauté`,
      contractLabel: "Contrat",
      sectorLabel: "Univers",
      all: "Tous",
      empty: "Aucun résultat",
      emptyHint: "Essayez d'élargir votre recherche.",
      reset: "Réinitialiser",
      mapHeader: "CARTE",
      backToList: "Toutes les offres",
      apply: "Postuler en 1 clic",
      save: "Sauvegarder",
      share: "Partager",
      similar: "Offres similaires",
      similarEyebrow: "Continuer l'exploration",
    },
    footer: {
      candidatesCol: "Candidats",
      candidatesLinks: {
        allJobs: "Toutes les offres",
        bySector: "Par secteur",
        companies: "Entreprises",
        emailAlerts: "Alertes email",
      },
      recruitersCol: "Employeurs",
      recruitersLinks: {
        post: "Publier une offre",
        pricing: "Tarifs",
        contact: "Nous contacter",
      },
      brandCol: "HelloWork",
      brandLinks: {
        about: "À propos",
        legal: "Mentions légales",
        cgu: "CGU",
        privacy: "Confidentialité",
      },
      copyright: "© 2026 HelloWork — Monaco",
    },
  },
  en: {
    nav: {
      jobs: "Jobs",
      companies: "Companies",
      signin: "Sign in",
      signup: "Create account",
      postJob: "Hire",
      about: "About",
    },
    home: {
      title1: "Your next job",
      title2: "is in",
      titleHighlight: "Monaco",
      subtitle:
        "The job board of the Principality. Banking, yachting, hospitality, tech, luxury — every opportunity in one place.",

      latestEyebrow: "Latest jobs",
      jobsCount: (n: number) => `${n} jobs`,
      seeAll: "See all",
      seeAllJobs: "See all jobs",

      bySectorEyebrow: "By sector",

      hiringEyebrow: "Hiring right now",
      seeAllCompanies: "See all companies",

      alertTitle: "Get new jobs by email.",
      alertDesc:
        "One email a week, jobs that match what you're looking for.",
      alertEmailPlaceholder: "Your email",
      alertSubmit: "Subscribe",
    },
    search: {
      keyword: "Role, skill or keyword",
      sector: "All sectors",
      submit: "Search",
    },
    jobs: {
      heroEyebrow: "Opportunity directory",
      heroTitle: (n: number) =>
        `${n} job${n > 1 ? "s" : ""} in the Principality`,
      contractLabel: "Contract",
      sectorLabel: "Sector",
      all: "All",
      empty: "No results",
      emptyHint: "Try broadening your search.",
      reset: "Reset",
      mapHeader: "MAP",
      backToList: "All jobs",
      apply: "Apply in one click",
      save: "Save",
      share: "Share",
      similar: "Similar jobs",
      similarEyebrow: "Keep exploring",
    },
    footer: {
      candidatesCol: "Candidates",
      candidatesLinks: {
        allJobs: "All jobs",
        bySector: "By sector",
        companies: "Companies",
        emailAlerts: "Email alerts",
      },
      recruitersCol: "Employers",
      recruitersLinks: {
        post: "Post a job",
        pricing: "Pricing",
        contact: "Contact us",
      },
      brandCol: "HelloWork",
      brandLinks: {
        about: "About",
        legal: "Legal notice",
        cgu: "Terms",
        privacy: "Privacy",
      },
      copyright: "© 2026 HelloWork — Monaco",
    },
  },
} as const;

export type Dict = typeof dictionaries.fr;

export function getDict(locale: Locale): Dict {
  return (dictionaries[locale] ?? dictionaries.fr) as Dict;
}
