"use client";

/**
 * Store recruteur fake (offres + candidats + applications + fiche entreprise),
 * entièrement client-side via localStorage. Même pattern que `auth.ts` et
 * `candidate-store.ts` : `useSyncExternalStore` + module-level state, pour
 * qu'on puisse plus tard remplacer par Supabase sans toucher l'UI.
 *
 * Volontairement séparé du `candidate-store` : ce sont deux comptes démo
 * distincts (Camille candidate / Pierre Reynaud SBM). On NE synchronise pas
 * les candidatures du candidate-store vers ici — l'employer voit ses propres
 * 45 candidats fake seedés.
 */

import { useSyncExternalStore } from "react";
import {
  type ExperienceLevel,
  type JobType,
  type Sector,
  type WorkTime,
  jobsForCompany,
} from "./data";

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
  /** D'où vient ce candidat. */
  source: CandidateSource;
  /** Qui l'a ajouté (TeamMember.id ou "system"). */
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

/** D'où vient le candidat. */
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
  /** Titre optionnel affiché en ed-label-sm au-dessus du bloc. */
  title?: string;
  /** Contenu principal (texte, citation, URL…). */
  content?: string;
  /** Pour image/gallery : data URLs ou picsum URLs. */
  images?: string[];
  /** Pour quote : auteur. */
  author?: string;
  /** Pour stats : paires clé/valeur. */
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
  /** Blocs custom de la fiche entreprise (ordonnés). */
  blocks?: CompanyBlock[];
};

type EmployerState = {
  jobs: EmployerJob[];
  candidates: EmployerCandidate[];
  applications: EmployerApplication[];
  companyProfile: EmployerCompanyProfile | null;
  team: TeamMember[];
  onboarding: OnboardingState;
};

/* ─── Storage / state ────────────────────────────────────────────── */

const STORAGE_KEY = "mur.employer";

const EMPTY: EmployerState = {
  jobs: [],
  candidates: [],
  applications: [],
  companyProfile: null,
  team: [],
  onboarding: { completed: [] },
};

let cached: EmployerState = EMPTY;
let loaded = false;
const subscribers = new Set<() => void>();

function loadFromStorage(): EmployerState {
  if (typeof window === "undefined") return EMPTY;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return EMPTY;
    const parsed = JSON.parse(raw) as Partial<EmployerState>;
    // Migration douce : tous les arrays défaultent à [], applications.events
    // défaultent à [] elles aussi.
    const jobs = Array.isArray(parsed.jobs) ? parsed.jobs : [];
    const candidates = Array.isArray(parsed.candidates)
      ? parsed.candidates
      : [];
    const applications = Array.isArray(parsed.applications)
      ? parsed.applications.map((a) => ({
          ...a,
          events: Array.isArray(a.events) ? a.events : [],
        }))
      : [];
    // Migration douce : source défaultée à "platform" sur les vieux candidats
    const migratedCandidates = candidates.map((c) => ({
      ...c,
      source: (c as { source?: CandidateSource }).source ?? ("platform" as CandidateSource),
    }));
    return {
      jobs,
      candidates: migratedCandidates,
      applications,
      companyProfile: parsed.companyProfile ?? null,
      team: Array.isArray(parsed.team) ? parsed.team : [],
      onboarding: parsed.onboarding ?? { completed: [] },
    };
  } catch {
    return EMPTY;
  }
}

function persist(): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(cached));
}

function ensureLoaded(): void {
  if (loaded || typeof window === "undefined") return;
  cached = loadFromStorage();
  loaded = true;
}

function emit(): void {
  cached = { ...cached };
  for (const cb of subscribers) cb();
}

function subscribe(cb: () => void): () => void {
  ensureLoaded();
  subscribers.add(cb);
  const onStorage = (e: StorageEvent) => {
    if (e.key === STORAGE_KEY) {
      cached = loadFromStorage();
      cb();
    }
  };
  window.addEventListener("storage", onStorage);
  return () => {
    subscribers.delete(cb);
    window.removeEventListener("storage", onStorage);
  };
}

function getSnapshot(): EmployerState {
  ensureLoaded();
  return cached;
}

function getServerSnapshot(): EmployerState {
  return EMPTY;
}

/** Hook React : retourne l'état complet du store recruteur. */
export function useEmployer(): EmployerState {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

/* ─── Utils ──────────────────────────────────────────────────────── */

function uid(prefix: string): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.random()
    .toString(36)
    .slice(2, 7)}`;
}

function slugify(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 60);
}

/* ─── Jobs CRUD ──────────────────────────────────────────────────── */

export function createJob(
  input: Omit<
    EmployerJob,
    "id" | "createdAt" | "updatedAt" | "slug" | "views" | "status"
  > & { status?: EmployerJobStatus },
): EmployerJob {
  ensureLoaded();
  const now = new Date().toISOString();
  const id = uid("emp-job");
  const job: EmployerJob = {
    ...input,
    id,
    slug: `${slugify(input.title)}-${id.slice(-5)}`,
    status: input.status ?? "published",
    views: 0,
    createdAt: now,
    updatedAt: now,
  };
  cached = { ...cached, jobs: [job, ...cached.jobs] };
  persist();
  emit();
  return job;
}

export function updateJob(id: string, patch: Partial<EmployerJob>): void {
  ensureLoaded();
  cached = {
    ...cached,
    jobs: cached.jobs.map((j) =>
      j.id === id ? { ...j, ...patch, updatedAt: new Date().toISOString() } : j,
    ),
  };
  persist();
  emit();
}

export function deleteJob(id: string): void {
  ensureLoaded();
  cached = {
    ...cached,
    jobs: cached.jobs.filter((j) => j.id !== id),
    applications: cached.applications.filter((a) => a.jobId !== id),
  };
  persist();
  emit();
}

export function setJobStatus(id: string, status: EmployerJobStatus): void {
  updateJob(id, { status });
}

export function getEmployerJob(id: string): EmployerJob | undefined {
  ensureLoaded();
  return cached.jobs.find((j) => j.id === id);
}

/* ─── Applications + kanban ──────────────────────────────────────── */

export function getEmployerApplication(
  id: string,
): EmployerApplication | undefined {
  ensureLoaded();
  return cached.applications.find((a) => a.id === id);
}

export function applicationsForJob(jobId: string): EmployerApplication[] {
  ensureLoaded();
  return cached.applications
    .filter((a) => a.jobId === jobId)
    .sort((a, b) => a.order - b.order);
}

export function applicationsByStatus(
  jobId: string,
): Record<EmployerApplicationStatus, EmployerApplication[]> {
  const empty: Record<EmployerApplicationStatus, EmployerApplication[]> = {
    received: [],
    reviewed: [],
    interview: [],
    offer: [],
    hired: [],
    rejected: [],
  };
  for (const app of applicationsForJob(jobId)) {
    empty[app.status].push(app);
  }
  // Tri intra-colonne par `order`
  for (const k of Object.keys(empty) as EmployerApplicationStatus[]) {
    empty[k].sort((a, b) => a.order - b.order);
  }
  return empty;
}

export function moveApplication(
  id: string,
  toStatus: EmployerApplicationStatus,
  toIndex?: number,
): void {
  ensureLoaded();
  const app = cached.applications.find((a) => a.id === id);
  if (!app) return;
  const fromStatus = app.status;

  // 1. On retire l'app de sa colonne actuelle (par jobId + status), et on
  //    décale les `order` des suivantes pour combler le trou.
  const sameJob = cached.applications.filter((a) => a.jobId === app.jobId);
  const fromCol = sameJob
    .filter((a) => a.status === fromStatus && a.id !== id)
    .sort((a, b) => a.order - b.order);
  fromCol.forEach((a, i) => {
    a.order = i;
  });

  // 2. On insère dans la colonne de destination à la bonne position.
  const toCol = sameJob
    .filter((a) => a.status === toStatus && a.id !== id)
    .sort((a, b) => a.order - b.order);
  const insertAt =
    toIndex === undefined
      ? toCol.length
      : Math.max(0, Math.min(toIndex, toCol.length));
  toCol.splice(insertAt, 0, app);
  toCol.forEach((a, i) => {
    a.order = i;
  });

  // 3. On met à jour le statut + un event si le status change vraiment.
  const now = new Date().toISOString();
  app.status = toStatus;
  app.updatedAt = now;
  if (fromStatus !== toStatus) {
    app.events = [
      ...app.events,
      {
        id: uid("evt"),
        type: "status_changed",
        at: now,
        from: fromStatus,
        to: toStatus,
      },
    ];
  }

  cached = { ...cached, applications: [...cached.applications] };
  persist();
  emit();
}

export function reorderApplication(id: string, toIndex: number): void {
  const app = cached.applications.find((a) => a.id === id);
  if (!app) return;
  moveApplication(id, app.status, toIndex);
}

export function addApplicationEvent(
  id: string,
  event: Omit<EmployerApplicationEvent, "id" | "at">,
): void {
  ensureLoaded();
  const now = new Date().toISOString();
  cached = {
    ...cached,
    applications: cached.applications.map((a) =>
      a.id === id
        ? {
            ...a,
            updatedAt: now,
            events: [
              ...a.events,
              { ...event, id: uid("evt"), at: now },
            ],
          }
        : a,
    ),
  };
  persist();
  emit();
}

export function rateApplication(id: string, rating: number): void {
  const clamped = Math.max(0, Math.min(5, Math.round(rating)));
  ensureLoaded();
  cached = {
    ...cached,
    applications: cached.applications.map((a) =>
      a.id === id ? { ...a, rating: clamped } : a,
    ),
  };
  persist();
  emit();
}

/* ─── Company profile ────────────────────────────────────────────── */

export function getCompanyOverride(
  companyId: string,
): EmployerCompanyProfile | null {
  ensureLoaded();
  if (
    cached.companyProfile &&
    cached.companyProfile.companyId === companyId
  ) {
    return cached.companyProfile;
  }
  return null;
}

export function updateCompanyProfile(
  patch: Partial<EmployerCompanyProfile> & { companyId?: string },
): void {
  ensureLoaded();
  const current = cached.companyProfile ?? { companyId: patch.companyId ?? "" };
  cached = {
    ...cached,
    companyProfile: {
      ...current,
      ...patch,
      updatedAt: new Date().toISOString(),
    } as EmployerCompanyProfile,
  };
  persist();
  emit();
}

export function setCoverFromFile(file: File): Promise<void> {
  return new Promise((resolve, reject) => {
    if (typeof window === "undefined") return resolve();
    if (!cached.companyProfile) {
      reject(
        new Error("companyProfile non initialisé — set une tagline d'abord"),
      );
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result;
      if (typeof dataUrl !== "string") {
        return reject(new Error("read failed"));
      }
      ensureLoaded();
      cached = {
        ...cached,
        companyProfile: {
          ...(cached.companyProfile ?? { companyId: "" }),
          coverDataUrl: dataUrl,
          hasCover: true,
          updatedAt: new Date().toISOString(),
        },
      };
      try {
        persist();
      } catch (e) {
        return reject(e as Error);
      }
      emit();
      resolve();
    };
    reader.onerror = () => reject(reader.error ?? new Error("read failed"));
    reader.readAsDataURL(file);
  });
}

export function removeCover(): void {
  ensureLoaded();
  if (!cached.companyProfile) return;
  cached = {
    ...cached,
    companyProfile: {
      ...cached.companyProfile,
      coverDataUrl: undefined,
      hasCover: false,
      updatedAt: new Date().toISOString(),
    },
  };
  persist();
  emit();
}

/* ─── Helpers UI ─────────────────────────────────────────────────── */

export const KANBAN_STATUSES: EmployerApplicationStatus[] = [
  "received",
  "reviewed",
  "interview",
  "offer",
  "hired",
];

export function statusLabel(s: EmployerApplicationStatus): string {
  switch (s) {
    case "received":
      return "Reçues";
    case "reviewed":
      return "CV consulté";
    case "interview":
      return "En entretien";
    case "offer":
      return "Offre envoyée";
    case "hired":
      return "Embauché";
    case "rejected":
      return "Refusé";
  }
}

export function statusTone(
  s: EmployerApplicationStatus,
): "muted" | "accent" | "fresh" | "danger" | "bar" {
  switch (s) {
    case "received":
      return "muted";
    case "reviewed":
      return "accent";
    case "interview":
      return "fresh";
    case "offer":
      return "fresh";
    case "hired":
      return "fresh";
    case "rejected":
      return "danger";
  }
}

export function jobStatusLabel(s: EmployerJobStatus): string {
  switch (s) {
    case "draft":
      return "Brouillon";
    case "published":
      return "Publiée";
    case "paused":
      return "En pause";
    case "closed":
      return "Fermée";
  }
}

export function jobStatusTone(
  s: EmployerJobStatus,
): "muted" | "accent" | "fresh" | "danger" {
  switch (s) {
    case "draft":
      return "muted";
    case "published":
      return "fresh";
    case "paused":
      return "accent";
    case "closed":
      return "danger";
  }
}

export function eventLabel(t: EmployerApplicationEventType): string {
  switch (t) {
    case "received":
      return "Candidature reçue";
    case "cv_viewed":
      return "CV consulté";
    case "status_changed":
      return "Statut modifié";
    case "message_sent":
      return "Message envoyé";
    case "note_added":
      return "Note ajoutée";
    case "interview_scheduled":
      return "Entretien planifié";
    case "offer_sent":
      return "Offre envoyée";
    case "hired":
      return "Embauché";
    case "rejected":
      return "Refusé";
  }
}

/* ─── Seed démo (Pierre Reynaud / SBM Monte-Carlo) ───────────────── */

const FIRST_NAMES = [
  "Sofia",
  "Lorenzo",
  "Marie",
  "Ahmed",
  "Camille",
  "Giulia",
  "Marc",
  "Yasmine",
  "Thomas",
  "Léa",
  "Karim",
  "Eleonora",
  "James",
  "Inès",
  "Paolo",
  "Sarah",
  "Andrei",
  "Clara",
  "Hugo",
  "Anaïs",
  "Matteo",
  "Olivia",
  "Rashid",
  "Léonie",
  "Vincent",
  "Beatrice",
  "Adrien",
  "Nour",
  "Pierre",
  "Federica",
];

const LAST_NAMES = [
  "Bianchi",
  "Rossi",
  "Dubois",
  "El Amri",
  "Conti",
  "Lefebvre",
  "Martins",
  "Riva",
  "Mansouri",
  "Greco",
  "Petit",
  "Ferrari",
  "Smith",
  "Bouchareb",
  "Romano",
  "Bernard",
  "Ivanov",
  "Moreno",
  "Vasseur",
  "De Luca",
  "Russo",
  "Garcia",
  "Hassan",
  "Marini",
  "Léger",
  "Esposito",
  "Lévy",
  "Khalil",
  "Sanchez",
  "Galli",
];

const HEADLINES = [
  "Chef de Rang — Restaurant gastronomique",
  "Concierge Clefs d'Or",
  "Réceptionniste 5*",
  "Sous-Chef — Cuisine méditerranéenne",
  "Spa Therapist senior",
  "Voiturier-bagagiste",
  "Maître d'hôtel",
  "Responsable Hébergement",
  "Sommelier",
  "Pâtissier",
  "Chef de Brigade",
  "Hôte/sse VIP",
  "Gouvernant·e",
  "Bartender — cocktails signature",
  "F&B Manager",
  "Chef de Réception",
];

const SKILLS_POOL = [
  "Service haut-de-gamme",
  "Anglais courant",
  "Italien courant",
  "Russe",
  "Mandarin",
  "Sommellerie",
  "Mixologie",
  "OperaCloud",
  "Mews",
  "Salesforce CRM",
  "Pâtisserie française",
  "Cuisine méditerranéenne",
  "Service à la russe",
  "Conciergerie",
  "Gestion d'équipe",
  "HACCP",
  "Yield management",
  "Excel avancé",
  "Étoile Michelin",
  "Palace",
];

const COVERS = [
  "Bonjour, votre maison fait rêver depuis dix ans, et j'aimerais beaucoup contribuer à son service signature.",
  "Après 6 ans dans un palace parisien, je cherche à m'établir à Monaco et votre offre correspond exactement à mon projet.",
  "Mon expérience en service étoilé et ma maîtrise du russe et de l'italien me permettraient de m'intégrer rapidement.",
  "Je serais ravi·e d'échanger sur cette opportunité — disponible immédiatement, mobile sur la Principauté.",
  "Le profil correspond parfaitement à mon parcours et j'ai déjà eu l'occasion de croiser certains de vos collaborateurs sur le Grand Prix.",
];

function pick<T>(arr: readonly T[], i: number): T {
  return arr[i % arr.length];
}

function pickMany<T>(arr: readonly T[], seed: number, count: number): T[] {
  const out: T[] = [];
  for (let k = 0; k < count; k++) out.push(arr[(seed + k * 7) % arr.length]);
  return out;
}

function makeCandidate(i: number): EmployerCandidate {
  const first = pick(FIRST_NAMES, i);
  const last = pick(LAST_NAMES, i + 3);
  const headline = pick(HEADLINES, i + 1);
  const palette = [
    "#1C3D5A",
    "#7c1d2c",
    "#0a4d3a",
    "#062b3e",
    "#6B4423",
    "#5A2A2A",
    "#4A3D5A",
    "#2A4A5A",
  ];
  return {
    id: `emp-cand-${i + 1}`,
    fullName: `${first} ${last}`,
    email: `${first.toLowerCase()}.${last.toLowerCase().replace(/\s/g, "")}@example.com`,
    phone: `+377 06 ${10 + (i % 89)} ${20 + (i % 70)} ${30 + (i % 60)} ${40 + (i % 50)}`,
    location: pick(
      ["Monaco", "Beausoleil", "Cap d'Ail", "Roquebrune", "Menton", "Nice"],
      i,
    ),
    headline,
    bio: `${i % 4 === 0 ? "10+" : i % 3 === 0 ? "5-8" : "3-5"} ans d'expérience en hôtellerie de luxe, dont plusieurs saisons en palace.`,
    experienceYears: 3 + (i % 12),
    skills: pickMany(SKILLS_POOL, i, 4 + (i % 4)),
    languages: pickMany(
      ["Français", "Anglais", "Italien", "Russe", "Espagnol"],
      i,
      2 + (i % 3),
    ),
    sectors: ["Hôtellerie & Restauration"],
    avatarColor: palette[i % palette.length],
    initials: `${first[0]}${last[0]}`.toUpperCase(),
    linkedinUrl: i % 2 === 0 ? `linkedin.com/in/${slugify(first + " " + last)}` : undefined,
    cvFileName: `${first}_${last}_CV.pdf`.replace(/\s/g, "_"),
    source: "platform",
  };
}

const STATUS_DISTRIBUTION: Array<{
  status: EmployerApplicationStatus;
  weight: number;
}> = [
  { status: "received", weight: 35 },
  { status: "reviewed", weight: 25 },
  { status: "interview", weight: 18 },
  { status: "offer", weight: 8 },
  { status: "hired", weight: 5 },
  { status: "rejected", weight: 9 },
];

function pickStatus(i: number): EmployerApplicationStatus {
  const total = STATUS_DISTRIBUTION.reduce((s, d) => s + d.weight, 0);
  const target = (i * 13 + 7) % total;
  let acc = 0;
  for (const d of STATUS_DISTRIBUTION) {
    acc += d.weight;
    if (target < acc) return d.status;
  }
  return "received";
}

export function seedDemoEmployer(args: {
  companyId: string;
  recruiterName: string;
}): void {
  ensureLoaded();
  if (cached.jobs.length > 0 && cached.applications.length > 0) return;

  const day = 24 * 60 * 60 * 1000;
  const now = Date.now();

  // 1. EmployerJobs depuis les offres seedées de l'entreprise
  const seedJobs = jobsForCompany(args.companyId);
  const employerJobs: EmployerJob[] = seedJobs.map((j, idx) => {
    const id = `emp-job-seed-${idx + 1}`;
    return {
      id,
      companyId: args.companyId,
      slug: j.slug,
      title: j.title,
      type: j.type,
      level: j.level,
      sector: j.sector,
      location: j.location,
      remote: j.remote,
      workTime: j.workTime,
      lang: j.lang,
      languages: j.languages,
      salaryMin: j.salaryMin,
      salaryMax: j.salaryMax,
      shortDescription: j.shortDescription,
      description: j.description,
      responsibilities: j.responsibilities,
      requirements: j.requirements,
      benefits: j.benefits,
      tags: j.tags,
      status: "published",
      views: 250 + idx * 137 + (j.title.length % 11) * 23,
      createdAt: new Date(now - (15 - idx * 2) * day).toISOString(),
      updatedAt: new Date(now - idx * day).toISOString(),
      fromSeed: true,
      seedJobId: j.id,
    };
  });

  // 2. 30 candidats fake
  const candidates: EmployerCandidate[] = Array.from({ length: 30 }, (_, i) =>
    makeCandidate(i),
  );

  // 3. ~45 applications réparties sur les 5 jobs
  const applications: EmployerApplication[] = [];
  let appIdx = 0;
  const orderCounters: Record<string, Record<EmployerApplicationStatus, number>> =
    {};

  for (let i = 0; i < 45; i++) {
    const job = employerJobs[i % employerJobs.length];
    const candidate = candidates[i % candidates.length];
    const status = pickStatus(i);
    const matchScore = 55 + ((i * 7) % 42);
    const ageDays = (i * 11 + 1) % 21;
    const appliedAt = new Date(now - ageDays * day).toISOString();
    const updatedAt = new Date(
      now - Math.max(0, ageDays - (i % 4)) * day,
    ).toISOString();

    if (!orderCounters[job.id]) {
      orderCounters[job.id] = {
        received: 0,
        reviewed: 0,
        interview: 0,
        offer: 0,
        hired: 0,
        rejected: 0,
      };
    }
    const order = orderCounters[job.id][status]++;

    const events: EmployerApplicationEvent[] = [
      {
        id: `evt-${appIdx}-1`,
        type: "received",
        at: appliedAt,
        text: i % 3 === 0 ? "Candidature reçue avec lettre" : "Candidature reçue",
      },
    ];
    if (status !== "received") {
      events.push({
        id: `evt-${appIdx}-2`,
        type: "cv_viewed",
        at: new Date(now - Math.max(0, ageDays - 1) * day).toISOString(),
        by: args.recruiterName,
      });
    }
    if (
      status === "interview" ||
      status === "offer" ||
      status === "hired"
    ) {
      events.push({
        id: `evt-${appIdx}-3`,
        type: "interview_scheduled",
        at: new Date(now - Math.max(0, ageDays - 3) * day).toISOString(),
        by: args.recruiterName,
        text: `Entretien planifié — ${["lundi 10h", "mardi 14h", "mercredi 11h", "jeudi 16h"][i % 4]}`,
      });
    }
    if (status === "offer" || status === "hired") {
      events.push({
        id: `evt-${appIdx}-4`,
        type: "offer_sent",
        at: new Date(now - Math.max(0, ageDays - 5) * day).toISOString(),
        by: args.recruiterName,
        text: "Offre envoyée par email",
      });
    }
    if (status === "hired") {
      events.push({
        id: `evt-${appIdx}-5`,
        type: "hired",
        at: new Date(now - Math.max(0, ageDays - 7) * day).toISOString(),
        by: args.recruiterName,
        text: "Embauche confirmée",
      });
    }
    if (status === "rejected") {
      events.push({
        id: `evt-${appIdx}-6`,
        type: "rejected",
        at: updatedAt,
        by: args.recruiterName,
      });
    }

    applications.push({
      id: `emp-app-${i + 1}`,
      jobId: job.id,
      candidateId: candidate.id,
      status,
      matchScore,
      rating: i % 5 === 0 ? 4 : i % 6 === 0 ? 5 : 0,
      appliedAt,
      updatedAt,
      coverLetter: i % 3 === 0 ? COVERS[i % COVERS.length] : undefined,
      events,
      order,
    });
    appIdx++;
  }

  // 4. Équipe seedée (le user connecté + 2 collègues fictifs)
  const now2 = new Date().toISOString();
  const team: TeamMember[] = [
    {
      id: "team-1",
      fullName: args.recruiterName,
      email: "p.reynaud@montecarlosbm.com",
      role: "admin",
      avatarColor: "#7c1d2c",
      initials: args.recruiterName
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2),
      addedAt: new Date(now - 60 * day).toISOString(),
      lastActiveAt: now2,
    },
    {
      id: "team-2",
      fullName: "Sophie Martin",
      email: "s.martin@montecarlosbm.com",
      role: "recruiter",
      avatarColor: "#1C3D5A",
      initials: "SM",
      addedAt: new Date(now - 45 * day).toISOString(),
      lastActiveAt: new Date(now - 1 * day).toISOString(),
    },
    {
      id: "team-3",
      fullName: "Lucas Ferri",
      email: "l.ferri@montecarlosbm.com",
      role: "viewer",
      avatarColor: "#0a4d3a",
      initials: "LF",
      addedAt: new Date(now - 20 * day).toISOString(),
    },
  ];

  cached = {
    jobs: employerJobs,
    candidates,
    applications,
    companyProfile: null,
    team,
    onboarding: {
      completed: [
        "company_created",
        "profile_completed",
        "first_job_published",
        "team_invited",
        "company_page_customized",
      ],
    },
  };
  loaded = true;
  persist();
  emit();
}

/* ─── Team ───────────────────────────────────────────────────────── */

export function addTeamMember(
  member: Omit<TeamMember, "id" | "addedAt">,
): TeamMember {
  ensureLoaded();
  const created: TeamMember = {
    ...member,
    id: uid("team"),
    addedAt: new Date().toISOString(),
  };
  cached = { ...cached, team: [...cached.team, created] };
  persist();
  emit();
  return created;
}

export function updateTeamMember(
  id: string,
  patch: Partial<TeamMember>,
): void {
  ensureLoaded();
  cached = {
    ...cached,
    team: cached.team.map((m) => (m.id === id ? { ...m, ...patch } : m)),
  };
  persist();
  emit();
}

export function removeTeamMember(id: string): void {
  ensureLoaded();
  cached = { ...cached, team: cached.team.filter((m) => m.id !== id) };
  persist();
  emit();
}

export function teamRoleLabel(r: TeamRole): string {
  switch (r) {
    case "admin":
      return "Admin";
    case "recruiter":
      return "Recruteur";
    case "viewer":
      return "Lecteur";
  }
}

/* ─── Ajout manuel de candidats ──────────────────────────────────── */

export function addManualCandidate(
  input: Omit<EmployerCandidate, "id" | "source"> & {
    jobId?: string;
    coverLetter?: string;
  },
): { candidate: EmployerCandidate; application?: EmployerApplication } {
  ensureLoaded();
  const now = new Date().toISOString();
  const candidate: EmployerCandidate = {
    ...input,
    id: uid("emp-cand"),
    source: "manual",
  };
  cached = { ...cached, candidates: [...cached.candidates, candidate] };

  let application: EmployerApplication | undefined;
  if (input.jobId) {
    application = {
      id: uid("emp-app"),
      jobId: input.jobId,
      candidateId: candidate.id,
      status: "received",
      matchScore: 50,
      rating: 0,
      appliedAt: now,
      updatedAt: now,
      coverLetter: input.coverLetter,
      events: [
        {
          id: uid("evt"),
          type: "received",
          at: now,
          text: "Candidat ajouté manuellement",
          by: input.addedBy,
        },
      ],
      order: cached.applications.filter((a) => a.jobId === input.jobId && a.status === "received").length,
    };
    cached = {
      ...cached,
      applications: [...cached.applications, application],
    };
  }

  persist();
  emit();
  return { candidate, application };
}

/**
 * Import CSV : parse un tableau de lignes (chaque ligne est un objet clé/valeur)
 * et crée les candidats + candidatures correspondantes.
 * Retourne le nombre de candidats créés.
 */
export function importCandidatesFromCsv(
  rows: Array<Record<string, string>>,
  jobId: string | undefined,
  addedBy: string,
): number {
  ensureLoaded();
  let count = 0;
  const now = new Date().toISOString();
  const palette = [
    "#1C3D5A", "#7c1d2c", "#0a4d3a", "#062b3e",
    "#6B4423", "#5A2A2A", "#4A3D5A", "#2A4A5A",
  ];

  for (const row of rows) {
    const fullName = (row.nom || row.name || row.fullName || "").trim();
    const email = (row.email || row.mail || "").trim();
    if (!fullName && !email) continue;

    const nameParts = fullName.split(/\s+/).filter(Boolean);
    const initials = nameParts.length >= 2
      ? `${nameParts[0][0]}${nameParts[nameParts.length - 1][0]}`.toUpperCase()
      : fullName.slice(0, 2).toUpperCase();

    const candidate: EmployerCandidate = {
      id: uid("emp-cand"),
      fullName: fullName || email.split("@")[0],
      email,
      phone: (row.telephone || row.phone || row.tel || "").trim() || undefined,
      location: (row.lieu || row.location || row.ville || "").trim() || undefined,
      headline: (row.poste || row.headline || row.titre || "").trim() || undefined,
      bio: undefined,
      experienceYears: row.experience
        ? parseInt(row.experience, 10) || undefined
        : undefined,
      skills: (row.competences || row.skills || "")
        .split(/[,;]/)
        .map((s) => s.trim())
        .filter(Boolean),
      languages: (row.langues || row.languages || "")
        .split(/[,;]/)
        .map((s) => s.trim())
        .filter(Boolean),
      sectors: [],
      avatarColor: palette[count % palette.length],
      initials,
      linkedinUrl: (row.linkedin || "").trim() || undefined,
      cvFileName: undefined,
      source: "csv_import",
      addedBy,
    };

    cached = { ...cached, candidates: [...cached.candidates, candidate] };

    if (jobId) {
      const app: EmployerApplication = {
        id: uid("emp-app"),
        jobId,
        candidateId: candidate.id,
        status: "received",
        matchScore: 50,
        rating: 0,
        appliedAt: now,
        updatedAt: now,
        events: [
          {
            id: uid("evt"),
            type: "received",
            at: now,
            text: "Importé depuis CSV",
            by: addedBy,
          },
        ],
        order: cached.applications.filter(
          (a) => a.jobId === jobId && a.status === "received",
        ).length,
      };
      cached = {
        ...cached,
        applications: [...cached.applications, app],
      };
    }

    count++;
  }

  persist();
  emit();
  return count;
}

/* ─── Onboarding ─────────────────────────────────────────────────── */

export const ONBOARDING_STEPS: Array<{
  key: OnboardingStep;
  label: string;
  description: string;
}> = [
  {
    key: "company_created",
    label: "Creer votre entreprise",
    description: "Nom, secteur, taille et localisation de votre societe.",
  },
  {
    key: "profile_completed",
    label: "Completer la fiche entreprise",
    description:
      "Description, positionnement, culture, avantages — ce que les candidats voient.",
  },
  {
    key: "first_job_published",
    label: "Publier votre premiere offre",
    description: "Une seule offre suffit pour commencer a recevoir des candidatures.",
  },
  {
    key: "team_invited",
    label: "Inviter votre equipe",
    description: "Ajoutez vos collegues pour gerer les candidatures ensemble.",
  },
  {
    key: "company_page_customized",
    label: "Personnaliser votre page publique",
    description:
      "Photo de couverture, tagline — rendez votre fiche attractive.",
  },
];

export function completeOnboardingStep(step: OnboardingStep): void {
  ensureLoaded();
  if (cached.onboarding.completed.includes(step)) return;
  cached = {
    ...cached,
    onboarding: {
      ...cached.onboarding,
      completed: [...cached.onboarding.completed, step],
    },
  };
  persist();
  emit();
}

export function skipOnboarding(): void {
  ensureLoaded();
  cached = {
    ...cached,
    onboarding: {
      ...cached.onboarding,
      skippedAt: new Date().toISOString(),
    },
  };
  persist();
  emit();
}

export function onboardingProgress(): {
  done: number;
  total: number;
  percent: number;
  isComplete: boolean;
} {
  ensureLoaded();
  const done = cached.onboarding.completed.length;
  const total = ONBOARDING_STEPS.length;
  return {
    done,
    total,
    percent: Math.round((done / total) * 100),
    isComplete: done >= total,
  };
}

/**
 * Fake "scan IA" d'un domaine d'entreprise. Simule un appel API qui
 * retournerait des suggestions de description, positionnement, secteur.
 * En vrai, on appellerait Claude API avec le contenu du site web.
 */
export function scanCompanyDomain(domain: string): Promise<NonNullable<OnboardingState["aiSuggestion"]>> {
  return new Promise((resolve) => {
    // Simule un delai reseau de 1.5s
    window.setTimeout(() => {
      const domainLower = domain.toLowerCase();

      // Suggestions pre-ecrites par domaine connu
      const suggestions: Record<string, NonNullable<OnboardingState["aiSuggestion"]>> = {
        "montecarlosbm.com": {
          description:
            "Groupe historique fonde en 1863, la Societe des Bains de Mer opere l'Hotel de Paris, l'Hotel Hermitage, le Monte-Carlo Beach, le Casino de Monte-Carlo, et plusieurs restaurants etoiles Michelin. Premier employeur prive de la Principaute avec plus de 4 000 collaborateurs.",
          positioning:
            "Leader inconteste de l'hotellerie ultra-luxe a Monaco. Positionnement unique : un groupe integre qui gere a la fois l'hebergement, la restauration, le gaming et l'evenementiel sur un territoire de 2 km².",
          sector: "Hotellerie & Restauration",
          size: "200-500",
          founded: "1863",
        },
      };

      const match = suggestions[domainLower];
      if (match) {
        ensureLoaded();
        cached = {
          ...cached,
          onboarding: {
            ...cached.onboarding,
            scannedDomain: domain,
            aiSuggestion: match,
          },
        };
        persist();
        emit();
        resolve(match);
        return;
      }

      // Suggestion generique pour les domaines inconnus
      const generic: NonNullable<OnboardingState["aiSuggestion"]> = {
        description: `Entreprise basee a Monaco, ${domain} opere dans un environnement international exigeant. Nous analysons actuellement votre site web pour affiner cette description.`,
        positioning:
          "Acteur monegasque reconnu dans son secteur, avec une clientele internationale et des standards de qualite eleves.",
        sector: "Tech & Digital",
        size: "10-50",
      };

      ensureLoaded();
      cached = {
        ...cached,
        onboarding: {
          ...cached.onboarding,
          scannedDomain: domain,
          aiSuggestion: generic,
        },
      };
      persist();
      emit();
      resolve(generic);
    }, 1500);
  });
}

/* ─── Blocks CRUD ────────────────────────────────────────────────── */

export function getBlocks(): CompanyBlock[] {
  ensureLoaded();
  return cached.companyProfile?.blocks ?? [];
}

export function setBlocks(blocks: CompanyBlock[]): void {
  ensureLoaded();
  if (!cached.companyProfile) return;
  cached = {
    ...cached,
    companyProfile: {
      ...cached.companyProfile,
      blocks,
      updatedAt: new Date().toISOString(),
    },
  };
  persist();
  emit();
}

export function addBlock(
  type: BlockType,
  atIndex?: number,
): CompanyBlock {
  ensureLoaded();
  const block: CompanyBlock = {
    id: uid("block"),
    type,
    title: defaultBlockTitle(type),
    content: type === "text" ? "" : undefined,
    images: type === "image" ? [] : type === "gallery" ? [] : undefined,
    stats:
      type === "stats"
        ? [
            { label: "Collaborateurs", value: "200+" },
            { label: "Annee de creation", value: "1863" },
          ]
        : undefined,
    items: type === "perks" ? [] : undefined,
  };
  const blocks = [...(cached.companyProfile?.blocks ?? [])];
  if (atIndex !== undefined) {
    blocks.splice(atIndex, 0, block);
  } else {
    blocks.push(block);
  }
  setBlocks(blocks);
  return block;
}

export function updateBlock(
  id: string,
  patch: Partial<CompanyBlock>,
): void {
  const blocks = getBlocks().map((b) =>
    b.id === id ? { ...b, ...patch } : b,
  );
  setBlocks(blocks);
}

export function removeBlock(id: string): void {
  setBlocks(getBlocks().filter((b) => b.id !== id));
}

export function moveBlock(id: string, direction: "up" | "down"): void {
  const blocks = [...getBlocks()];
  const idx = blocks.findIndex((b) => b.id === id);
  if (idx < 0) return;
  const target = direction === "up" ? idx - 1 : idx + 1;
  if (target < 0 || target >= blocks.length) return;
  [blocks[idx], blocks[target]] = [blocks[target], blocks[idx]];
  setBlocks(blocks);
}

export function addImageToBlock(blockId: string, dataUrl: string): void {
  const block = getBlocks().find((b) => b.id === blockId);
  if (!block) return;
  updateBlock(blockId, {
    images: [...(block.images ?? []), dataUrl],
  });
}

export function removeImageFromBlock(
  blockId: string,
  imageIndex: number,
): void {
  const block = getBlocks().find((b) => b.id === blockId);
  if (!block) return;
  updateBlock(blockId, {
    images: (block.images ?? []).filter((_, i) => i !== imageIndex),
  });
}

function defaultBlockTitle(type: BlockType): string {
  switch (type) {
    case "text":
      return "A propos";
    case "image":
      return "Photo";
    case "gallery":
      return "Galerie";
    case "quote":
      return "Temoignage";
    case "stats":
      return "Chiffres cles";
    case "perks":
      return "Avantages";
    case "video":
      return "Video";
  }
}

export function blockTypeLabel(type: BlockType): string {
  switch (type) {
    case "text":
      return "Texte";
    case "image":
      return "Image";
    case "gallery":
      return "Galerie";
    case "quote":
      return "Citation";
    case "stats":
      return "Chiffres";
    case "perks":
      return "Avantages";
    case "video":
      return "Video";
  }
}

export function candidateSourceLabel(s: CandidateSource): string {
  switch (s) {
    case "platform":
      return "Plateforme";
    case "manual":
      return "Ajout manuel";
    case "csv_import":
      return "Import CSV";
    case "referral":
      return "Cooptation";
  }
}

export function resetEmployer(): void {
  cached = EMPTY;
  loaded = true;
  if (typeof window !== "undefined") {
    window.localStorage.removeItem(STORAGE_KEY);
  }
  emit();
}
