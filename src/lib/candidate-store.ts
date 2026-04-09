"use client";

/**
 * Store candidat fake (profil + candidatures + sauvegardes), entièrement
 * client-side via localStorage. Même pattern que lib/auth.ts :
 * `useSyncExternalStore` + module-level state, pour qu'on puisse plus tard
 * remplacer par Supabase sans toucher l'UI.
 */

import { useSyncExternalStore } from "react";
import type { Job, Sector } from "./data";

export type ApplicationStatus =
  | "sent"
  | "viewed"
  | "interview"
  | "accepted"
  | "rejected";

export type ApplicationEventType =
  | "applied"
  | "cv_viewed"
  | "profile_viewed"
  | "message"
  | "interview_scheduled"
  | "accepted"
  | "rejected"
  | "note";

export type ApplicationEvent = {
  id: string;
  type: ApplicationEventType;
  at: string;
  text?: string;
  /** Pour les events venus du recruteur. */
  by?: string;
};

export type Application = {
  id: string;
  jobId: string;
  jobSlug: string;
  jobTitle: string;
  jobType: string;
  jobLocation: string;
  companyId: string;
  companySlug: string;
  companyName: string;
  companyDomain?: string;
  companyColor: string;
  companyInitials: string;
  status: ApplicationStatus;
  appliedAt: string; // ISO
  updatedAt: string; // ISO
  /** Petit message optionnel envoyé avec la candidature. */
  note?: string;
  /** Lettre de motivation jointe à la candidature. */
  coverLetter?: string;
  /** Historique des événements (timeline). */
  events: ApplicationEvent[];
};

export type Experience = {
  id: string;
  title: string;
  company: string;
  location?: string;
  startYear: number;
  endYear?: number;
  current: boolean;
  description?: string;
};

export type CandidateProfile = {
  fullName: string;
  email: string;
  phone?: string;
  location?: string;
  /** Intitulé actuel ("Senior Wealth Manager", "Chef de Rang"…). */
  headline?: string;
  bio?: string;
  experienceYears?: number;
  /** Historique professionnel détaillé. */
  experiences: Experience[];
  /** Compétences libres ("Excel", "Pitch deck", "FINMA"…). */
  skills: string[];
  languages: string[];
  sectors: Sector[];
  linkedinUrl?: string;
  websiteUrl?: string;
  /**
   * Photo de profil — stockée en data URL dans localStorage (limité ~1 Mo
   * en pratique, on ne resize pas pour la démo mais on warn si trop grand).
   */
  avatarDataUrl?: string;
  /** Métadonnées du CV (on ne stocke pas le binaire dans la démo). */
  cv?: {
    fileName: string;
    sizeBytes: number;
    uploadedAt: string;
  };
};

type CandidateState = {
  profile: CandidateProfile;
  applications: Application[];
  savedJobIds: string[];
};

const STORAGE_KEY = "mur.candidate";

const EMPTY: CandidateState = {
  profile: {
    fullName: "",
    email: "",
    languages: [],
    sectors: [],
    experiences: [],
    skills: [],
  },
  applications: [],
  savedJobIds: [],
};

let cached: CandidateState = EMPTY;
let loaded = false;
const subscribers = new Set<() => void>();

function loadFromStorage(): CandidateState {
  if (typeof window === "undefined") return EMPTY;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return EMPTY;
    const parsed = JSON.parse(raw) as Partial<CandidateState>;
    // Migration : s'assure que toutes les applications ont un `events[]`
    // (il n'existait pas dans les versions précédentes du store).
    const applications = (parsed.applications ?? []).map((a) => ({
      ...a,
      // Migration: companySlug derivé de companyId si absent
      companySlug: a.companySlug ?? a.companyId ?? "",
      events: Array.isArray(a.events)
        ? a.events
        : [
            {
              id: `migrated-${a.id}`,
              type: "applied" as const,
              at: a.appliedAt,
              text: "Candidature envoyée",
            },
          ],
    }));
    const profile = { ...EMPTY.profile, ...(parsed.profile ?? {}) };
    if (!Array.isArray(profile.experiences)) profile.experiences = [];
    if (!Array.isArray(profile.skills)) profile.skills = [];
    return {
      profile,
      applications,
      savedJobIds: parsed.savedJobIds ?? [],
    };
  } catch {
    return EMPTY;
  }
}

function persist() {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(cached));
}

function ensureLoaded() {
  if (loaded || typeof window === "undefined") return;
  cached = loadFromStorage();
  loaded = true;
}

function emit() {
  cached = { ...cached }; // nouvelle référence pour useSyncExternalStore
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

function getSnapshot(): CandidateState {
  ensureLoaded();
  return cached;
}

function getServerSnapshot(): CandidateState {
  return EMPTY;
}

export function useCandidate(): CandidateState {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

/* ─── Profile mutations ────────────────────────────────────────── */

export function updateProfile(patch: Partial<CandidateProfile>): void {
  ensureLoaded();
  cached = {
    ...cached,
    profile: { ...cached.profile, ...patch },
  };
  persist();
  emit();
}

export function setAvatarFromFile(file: File): Promise<void> {
  return new Promise((resolve, reject) => {
    if (typeof window === "undefined") return resolve();
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result;
      if (typeof dataUrl !== "string") return reject(new Error("read failed"));
      ensureLoaded();
      cached = {
        ...cached,
        profile: { ...cached.profile, avatarDataUrl: dataUrl },
      };
      try {
        persist();
      } catch (e) {
        // QuotaExceededError → image trop grosse
        return reject(e as Error);
      }
      emit();
      resolve();
    };
    reader.onerror = () => reject(reader.error ?? new Error("read failed"));
    reader.readAsDataURL(file);
  });
}

export function removeAvatar(): void {
  ensureLoaded();
  cached = {
    ...cached,
    profile: { ...cached.profile, avatarDataUrl: undefined },
  };
  persist();
  emit();
}

export function setCv(file: File): void {
  ensureLoaded();
  cached = {
    ...cached,
    profile: {
      ...cached.profile,
      cv: {
        fileName: file.name,
        sizeBytes: file.size,
        uploadedAt: new Date().toISOString(),
      },
    },
  };
  persist();
  emit();
}

export function removeCv(): void {
  ensureLoaded();
  cached = {
    ...cached,
    profile: { ...cached.profile, cv: undefined },
  };
  persist();
  emit();
}

/* ─── Applications ─────────────────────────────────────────────── */

export function createApplication(
  app: Omit<
    Application,
    "id" | "appliedAt" | "updatedAt" | "status" | "events"
  >,
): Application {
  ensureLoaded();
  // Si déjà candidat à cette offre, on retourne l'existante
  const existing = cached.applications.find((a) => a.jobId === app.jobId);
  if (existing) return existing;

  const now = new Date().toISOString();
  const created: Application = {
    ...app,
    id: `app-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    status: "sent",
    appliedAt: now,
    updatedAt: now,
    events: [
      {
        id: `evt-${Date.now()}`,
        type: "applied",
        at: now,
        text: app.coverLetter
          ? "Candidature envoyée avec lettre de motivation"
          : "Candidature envoyée",
      },
    ],
  };
  cached = {
    ...cached,
    applications: [created, ...cached.applications],
  };
  persist();
  emit();
  return created;
}

export function getApplication(id: string): Application | undefined {
  ensureLoaded();
  return cached.applications.find((a) => a.id === id);
}

export function withdrawApplication(id: string): void {
  ensureLoaded();
  cached = {
    ...cached,
    applications: cached.applications.filter((a) => a.id !== id),
  };
  persist();
  emit();
}

export function hasAppliedTo(jobId: string): boolean {
  ensureLoaded();
  return cached.applications.some((a) => a.jobId === jobId);
}

/* ─── Sauvegardes ──────────────────────────────────────────────── */

export function toggleSaved(jobId: string): void {
  ensureLoaded();
  const set = new Set(cached.savedJobIds);
  if (set.has(jobId)) set.delete(jobId);
  else set.add(jobId);
  cached = { ...cached, savedJobIds: Array.from(set) };
  persist();
  emit();
}

export function isSaved(jobId: string): boolean {
  ensureLoaded();
  return cached.savedJobIds.includes(jobId);
}

/* ─── Helpers UI ───────────────────────────────────────────────── */

export function statusLabel(s: ApplicationStatus): string {
  switch (s) {
    case "sent":
      return "Envoyée";
    case "viewed":
      return "CV consulté";
    case "interview":
      return "En entretien";
    case "accepted":
      return "Acceptée";
    case "rejected":
      return "Refusée";
  }
}

export function statusTone(
  s: ApplicationStatus,
): "muted" | "accent" | "fresh" | "danger" {
  switch (s) {
    case "sent":
      return "muted";
    case "viewed":
      return "accent";
    case "interview":
      return "fresh";
    case "accepted":
      return "fresh";
    case "rejected":
      return "danger";
  }
}

/**
 * Calcule le taux de complétion du profil (0-100). Sert au gauge dashboard.
 */
export function profileCompletion(p: CandidateProfile): number {
  const checks = [
    !!p.fullName,
    !!p.email,
    !!p.phone,
    !!p.location,
    !!p.headline,
    !!p.bio && p.bio.length > 20,
    typeof p.experienceYears === "number",
    p.experiences.length > 0,
    p.skills.length > 0,
    p.languages.length > 0,
    p.sectors.length > 0,
    !!p.avatarDataUrl,
    !!p.cv,
  ];
  const score = checks.filter(Boolean).length;
  return Math.round((score / checks.length) * 100);
}

/**
 * Pré-remplit le store avec un profil + 3 candidatures fictives, si jamais
 * il est vide. Appelé au login démo pour rendre le dashboard parlant.
 */
export function seedDemoCandidate(args: {
  fullName: string;
  email: string;
}): void {
  ensureLoaded();
  // Reseed si déjà semé MAIS sans expériences/skills (migration douce).
  const alreadySeeded =
    cached.applications.length > 0 || cached.profile.headline;
  if (
    alreadySeeded &&
    cached.profile.experiences.length > 0 &&
    cached.profile.skills.length > 0
  )
    return;

  const now = Date.now();
  const day = 24 * 60 * 60 * 1000;
  cached = {
    profile: {
      fullName: args.fullName,
      email: args.email,
      phone: "+377 06 12 34 56 78",
      location: "Monaco — Carré d'Or",
      headline: "Senior Wealth Manager — UHNW",
      bio: "10 ans en banque privée monégasque, portefeuille de 60 familles UHNW européennes et moyen-orientales. Trilingue FR/EN/IT, certifiée AMF.",
      experienceYears: 10,
      skills: [
        "Gestion de portefeuille UHNW",
        "Structuration patrimoniale",
        "Compliance LCB-FT",
        "Reporting client",
        "Excel avancé",
        "Pitch deck",
        "Bloomberg",
        "FINMA",
      ],
      languages: ["Français", "Anglais", "Italien"],
      sectors: ["Banque & Finance"],
      experiences: [
        {
          id: "exp-1",
          title: "Senior Wealth Manager — UHNW",
          company: "Banque privée monégasque",
          location: "Monaco",
          startYear: 2020,
          current: true,
          description:
            "Gestion d'un portefeuille de 60 familles UHNW européennes (AUM 800 M€). Coordination avec les équipes investissement et structuration patrimoniale. Reporting client mensuel.",
        },
        {
          id: "exp-2",
          title: "Wealth Manager",
          company: "Private bank — Genève",
          location: "Genève, Suisse",
          startYear: 2016,
          endYear: 2020,
          current: false,
          description:
            "Développement d'un portefeuille de clients HNW francophones et italophones, focus sur la structuration patrimoniale internationale.",
        },
        {
          id: "exp-3",
          title: "Analyste Crédit Privé — Junior",
          company: "Banque privée parisienne",
          location: "Paris",
          startYear: 2014,
          endYear: 2016,
          current: false,
          description:
            "Analyse de dossiers de financement structuré pour clientèle privée. Premier poste post-école de commerce.",
        },
      ],
      linkedinUrl: "linkedin.com/in/camille-laurent",
      cv: {
        fileName: "Camille_Laurent_CV_2026.pdf",
        sizeBytes: 287 * 1024,
        uploadedAt: new Date(now - 14 * day).toISOString(),
      },
    },
    applications: [
      {
        id: "seed-app-1",
        jobId: "j1",
        jobSlug: "wealth-manager-senior",
        jobTitle: "Wealth Manager Senior — Clientèle UHNW",
        jobType: "CDI",
        jobLocation: "Monaco — Carré d'Or",
        companyId: "c1",
        companySlug: "cmb-monaco",
        companyName: "CMB Monaco",
        companyDomain: "cmb.mc",
        companyColor: "#1e3a8a",
        companyInitials: "CMB",
        status: "interview",
        appliedAt: new Date(now - 8 * day).toISOString(),
        updatedAt: new Date(now - 2 * day).toISOString(),
        note: "Premier entretien prévu mardi 14h.",
        coverLetter:
          "Bonjour, après 10 ans en banque privée monégasque, je serais ravie de discuter de cette opportunité avec vos équipes. Mon portefeuille actuel est largement transférable (60 familles UHNW européennes, AUM 800M€).",
        events: [
          {
            id: "e-1-1",
            type: "applied",
            at: new Date(now - 8 * day).toISOString(),
            text: "Candidature envoyée avec lettre de motivation",
          },
          {
            id: "e-1-2",
            type: "cv_viewed",
            at: new Date(now - 7 * day).toISOString(),
            by: "Sophie M., DRH",
          },
          {
            id: "e-1-3",
            type: "profile_viewed",
            at: new Date(now - 6 * day).toISOString(),
            by: "Marc L., directeur de la Gestion Privée",
          },
          {
            id: "e-1-4",
            type: "message",
            at: new Date(now - 4 * day).toISOString(),
            by: "Sophie M., DRH",
            text: "Bonjour Camille, votre profil nous intéresse beaucoup. Seriez-vous disponible pour un premier échange visio cette semaine ?",
          },
          {
            id: "e-1-5",
            type: "interview_scheduled",
            at: new Date(now - 2 * day).toISOString(),
            by: "Sophie M., DRH",
            text: "Premier entretien planifié — mardi 14h au siège",
          },
        ],
      },
      {
        id: "seed-app-2",
        jobId: "gen-2",
        jobSlug: "compliance-officer-kyc-aml-101",
        jobTitle: "Compliance Officer KYC/AML",
        jobType: "CDI",
        jobLocation: "Monaco — Carré d'Or",
        companyId: "c1",
        companySlug: "cmb-monaco",
        companyName: "CMB Monaco",
        companyDomain: "cmb.mc",
        companyColor: "#1e3a8a",
        companyInitials: "CMB",
        status: "viewed",
        appliedAt: new Date(now - 5 * day).toISOString(),
        updatedAt: new Date(now - 4 * day).toISOString(),
        events: [
          {
            id: "e-2-1",
            type: "applied",
            at: new Date(now - 5 * day).toISOString(),
            text: "Candidature envoyée",
          },
          {
            id: "e-2-2",
            type: "cv_viewed",
            at: new Date(now - 4 * day).toISOString(),
            by: "Sophie M., DRH",
          },
        ],
      },
      {
        id: "seed-app-3",
        jobId: "j7",
        jobSlug: "avocat-droit-affaires",
        jobTitle: "Avocat Droit des Affaires — Corporate",
        jobType: "CDI",
        jobLocation: "Boulevard des Moulins",
        companyId: "c7",
        companySlug: "cms-pasquier-ciulla",
        companyName: "CMS Pasquier Ciulla",
        companyDomain: "cms.law",
        companyColor: "#0d2235",
        companyInitials: "CMS",
        status: "sent",
        appliedAt: new Date(now - 1 * day).toISOString(),
        updatedAt: new Date(now - 1 * day).toISOString(),
        events: [
          {
            id: "e-3-1",
            type: "applied",
            at: new Date(now - 1 * day).toISOString(),
            text: "Candidature envoyée",
          },
        ],
      },
    ],
    savedJobIds: ["j2", "j4", "j6"],
  };
  persist();
  emit();
}

/**
 * Score de matching offre × profil (0-100). Heuristique simple :
 * +25 si le secteur de l'offre est dans les secteurs ciblés, +15 si toutes
 * les langues exigées sont parlées (proportionnel sinon), bonus titre.
 */
/**
 * Score de matching offre x profil (0-100). Heuristique multi-critères :
 *
 * | Critère                    | Points max |
 * |---------------------------|-----------|
 * | Secteur cible              | 20        |
 * | Langues (proportionnel)    | 15        |
 * | Keywords titre/headline    | 10        |
 * | Skills overlap             | 15        |
 * | Experience years range     | 10        |
 * | Localisation match         | 5         |
 * | Base (tout le monde)       | 25        |
 * | **Total théorique**        | **100**   |
 */
export function matchScore(job: Job, profile: CandidateProfile): number {
  let score = 25; // base

  // Secteur : +20 si dans les secteurs ciblés
  if (profile.sectors.length > 0 && profile.sectors.includes(job.sector)) {
    score += 20;
  }

  // Langues : +15 proportionnel au ratio de langues couvertes
  const jobLangs = job.languages || [];
  if (jobLangs.length > 0 && profile.languages.length > 0) {
    const overlap = jobLangs.filter((l) =>
      profile.languages.some(
        (pl) => pl.toLowerCase() === l.toLowerCase(),
      ),
    ).length;
    score += Math.round((overlap / jobLangs.length) * 15);
  }

  // Headline keywords → titre du poste : +10 max
  if (profile.headline) {
    const headlineWords = profile.headline
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .split(/\s+/)
      .filter((w) => w.length > 3);
    const titleLower = job.title
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");
    const matches = headlineWords.filter((w) => titleLower.includes(w));
    if (matches.length > 0) {
      score += Math.min(10, matches.length * 4);
    }
  }

  // Skills overlap : +15 max — on compare les skills du candidat avec les
  // tags + responsibilities + requirements de l'offre (tous concaténés)
  if (profile.skills.length > 0) {
    const jobText = [
      ...(job.tags || []),
      ...(job.requirements || []),
      ...(job.responsibilities || []),
      job.shortDescription || "",
      job.description || "",
    ]
      .join(" ")
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");

    const skillMatches = profile.skills.filter((s) =>
      jobText.includes(
        s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, ""),
      ),
    ).length;

    const skillRatio =
      profile.skills.length > 0
        ? skillMatches / Math.min(profile.skills.length, 8)
        : 0;
    score += Math.round(skillRatio * 15);
  }

  // Experience : +10 si dans la bonne fourchette
  if (typeof profile.experienceYears === "number") {
    const level = job.level;
    const years = profile.experienceYears;
    const inRange =
      (level === "Junior" && years <= 3) ||
      (level === "Confirmé" && years >= 2 && years <= 7) ||
      (level === "Senior" && years >= 5 && years <= 15) ||
      (level === "Manager" && years >= 7) ||
      (level === "Direction" && years >= 10);
    if (inRange) score += 10;
    // Pénalité légère si totalement hors range
    else if (
      (level === "Senior" && years < 3) ||
      (level === "Junior" && years > 8)
    ) {
      score -= 5;
    }
  }

  // Localisation : +5 si même zone
  if (profile.location && job.location) {
    const profLoc = profile.location.toLowerCase();
    const jobLoc = job.location.toLowerCase();
    if (
      profLoc.includes("monaco") && jobLoc.includes("monaco") ||
      profLoc.includes(jobLoc.split("—")[0].trim()) ||
      jobLoc.includes(profLoc.split("—")[0].trim())
    ) {
      score += 5;
    }
  }

  return Math.max(0, Math.min(100, score));
}

export type MatchTier = "excellent" | "good" | "fair" | "low";

export function matchTier(score: number): MatchTier {
  if (score >= 80) return "excellent";
  if (score >= 60) return "good";
  if (score >= 40) return "fair";
  return "low";
}

export function matchTierLabel(t: MatchTier): string {
  switch (t) {
    case "excellent":
      return "Excellent match";
    case "good":
      return "Bon match";
    case "fair":
      return "Match moyen";
    case "low":
      return "Faible compatibilite";
  }
}

export function eventLabel(t: ApplicationEventType): string {
  switch (t) {
    case "applied":
      return "Candidature envoyée";
    case "cv_viewed":
      return "CV consulté";
    case "profile_viewed":
      return "Profil consulté";
    case "message":
      return "Message reçu";
    case "interview_scheduled":
      return "Entretien planifié";
    case "accepted":
      return "Candidature acceptée";
    case "rejected":
      return "Candidature refusée";
    case "note":
      return "Note";
  }
}

/**
 * Reset complet du store candidat — utilisé au signOut pour ne pas garder
 * les données démo entre deux comptes.
 */
export function resetCandidate(): void {
  cached = EMPTY;
  loaded = true;
  if (typeof window !== "undefined") {
    window.localStorage.removeItem(STORAGE_KEY);
  }
  emit();
}
