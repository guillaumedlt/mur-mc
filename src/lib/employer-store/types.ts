import type { ExperienceLevel, JobType, Sector, WorkTime } from "../data";

/* ─── Types ──────────────────────────────────────────────────────── */

export type EmployerJobStatus = "draft" | "published" | "paused" | "closed";

export type EmployerJob = {
  id: string;
  companyId: string;
  slug: string;
  title: string;
  type: JobType;
  level: ExperienceLevel;
  sector: Sector;
  location: string;
  remote: "Sur site" | "Hybride" | "Full remote";
  workTime: WorkTime;
  lang: "fr" | "en";
  languages: string[];
  salaryMin?: number;
  salaryMax?: number;
  shortDescription: string;
  description: string;
  responsibilities: string[];
  requirements: string[];
  benefits: string[];
  tags: string[];
  status: EmployerJobStatus;
  views: number;
  createdAt: string;
  updatedAt: string;
  fromSeed?: boolean;
  seedJobId?: string;
};

export type EmployerApplicationStatus =
  | "received"
  | "reviewed"
  | "interview"
  | "offer"
  | "hired"
  | "rejected";

export type EmployerCandidate = {
  id: string;
  fullName: string;
  email: string;
  phone?: string;
  location?: string;
  headline?: string;
  bio?: string;
  experienceYears?: number;
  skills: string[];
  languages: string[];
  sectors: Sector[];
  avatarColor: string;
  initials: string;
  linkedinUrl?: string;
  cvFileName?: string;
  /** D'ou vient ce candidat. */
  source: CandidateSource;
  /** Qui l'a ajoute (TeamMember.id ou "system"). */
  addedBy?: string;
};

export type EmployerApplicationEventType =
  | "received"
  | "cv_viewed"
  | "status_changed"
  | "message_sent"
  | "note_added"
  | "interview_scheduled"
  | "offer_sent"
  | "hired"
  | "rejected";

export type EmployerApplicationEvent = {
  id: string;
  type: EmployerApplicationEventType;
  at: string;
  text?: string;
  by?: string;
  from?: EmployerApplicationStatus;
  to?: EmployerApplicationStatus;
};

export type EmployerApplication = {
  id: string;
  jobId: string;
  candidateId: string;
  status: EmployerApplicationStatus;
  matchScore: number;
  rating: number;
  appliedAt: string;
  updatedAt: string;
  coverLetter?: string;
  events: EmployerApplicationEvent[];
  /** Position dans la colonne, pour le drag&drop reorder. */
  order: number;
};

export type TeamRole = "admin" | "recruiter" | "viewer";

export type TeamMember = {
  id: string;
  fullName: string;
  email: string;
  role: TeamRole;
  avatarColor: string;
  initials: string;
  addedAt: string;
  lastActiveAt?: string;
};

/** D'ou vient le candidat. */
export type CandidateSource = "platform" | "manual" | "csv_import" | "referral";

export type OnboardingStep =
  | "company_created"
  | "profile_completed"
  | "first_job_published"
  | "team_invited"
  | "company_page_customized";

export type OnboardingState = {
  completed: OnboardingStep[];
  skippedAt?: string;
  /** Domaine saisi a l'inscription pour le scan IA. */
  scannedDomain?: string;
  /** Resultat du scan IA (fake). */
  aiSuggestion?: {
    description?: string;
    positioning?: string;
    sector?: string;
    size?: string;
    founded?: string;
  };
};

/* ─── Systeme de blocs pour la fiche entreprise ──────────────────── */

export type BlockType =
  | "text"
  | "image"
  | "gallery"
  | "quote"
  | "stats"
  | "perks"
  | "video";

export type CompanyBlock = {
  id: string;
  type: BlockType;
  /** Titre optionnel affiche en ed-label-sm au-dessus du bloc. */
  title?: string;
  /** Contenu principal (texte, citation, URL…). */
  content?: string;
  /** Pour image/gallery : data URLs ou picsum URLs. */
  images?: string[];
  /** Pour quote : auteur. */
  author?: string;
  /** Pour stats : paires cle/valeur. */
  stats?: Array<{ label: string; value: string }>;
  /** Pour perks : liste de strings. */
  items?: string[];
};

export type EmployerCompanyProfile = {
  companyId: string;
  tagline?: string;
  description?: string;
  positioning?: string;
  culture?: string;
  perks?: string[];
  website?: string;
  coverDataUrl?: string;
  hasCover?: boolean;
  updatedAt?: string;
  /** Blocs custom de la fiche entreprise (ordonnes). */
  blocks?: CompanyBlock[];
};

export type EmployerState = {
  jobs: EmployerJob[];
  candidates: EmployerCandidate[];
  applications: EmployerApplication[];
  companyProfile: EmployerCompanyProfile | null;
  team: TeamMember[];
  onboarding: OnboardingState;
};
