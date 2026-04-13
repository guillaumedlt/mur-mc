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
  domain?: string;
  sector: Sector;
  size: string;
  description: string;
  tagline?: string;
  hasCover?: boolean;
  positioning?: string;
  culture?: string;
  location: string;
  website?: string;
  founded?: number;
  perks: string[];
  logoUrl?: string;
  coverUrl?: string;
  blocks?: Array<{
    id: string;
    type: string;
    title?: string;
    content?: string;
    images?: string[];
    author?: string;
    stats?: Array<{ label: string; value: string }>;
    items?: string[];
  }>;
};

export type Locale = "fr" | "en";

export type WorkTime = "Temps plein" | "Temps partiel";

export type ExperienceBucket = "debutant" | "1-3" | "3-5" | "5+";

export type Job = {
  id: string;
  slug: string;
  title: string;
  company: Company;
  type: JobType;
  level: ExperienceLevel;
  sector: Sector;
  location: string;
  lat: number;
  lng: number;
  remote: "Sur site" | "Hybride" | "Full remote";
  workTime: WorkTime;
  salaryMin?: number;
  salaryMax?: number;
  currency: "EUR";
  postedAt: string;
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

/* ─── Donnees ────────────────────────────────────────────── */

export const sectors: { name: Sector; count: number }[] = [
  { name: "Banque & Finance", count: 0 },
  { name: "Yachting", count: 0 },
  { name: "Hôtellerie & Restauration", count: 0 },
  { name: "Luxe & Retail", count: 0 },
  { name: "Tech & Digital", count: 0 },
  { name: "Immobilier", count: 0 },
  { name: "Juridique", count: 0 },
  { name: "Sport & Bien-être", count: 0 },
  { name: "Événementiel", count: 0 },
  { name: "Famille / Office", count: 0 },
];

export const companies: Company[] = [];

export const jobs: Job[] = [];

export const allJobs: Job[] = [];

/* ─── Helpers ────────────────────────────────────────────── */

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
  const now = new Date();
  const diff = Math.round(
    (now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24),
  );
  if (diff <= 0) return "Aujourd'hui";
  if (diff === 1) return "Hier";
  if (diff < 7) return `Il y a ${diff} jours`;
  if (diff < 30) return `Il y a ${Math.round(diff / 7)} sem.`;
  return `Il y a ${Math.round(diff / 30)} mois`;
}

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

export function daysSincePosted(iso: string): number {
  const d = new Date(iso);
  const now = new Date();
  return Math.max(
    0,
    Math.round((now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24)),
  );
}

export function jobCountByCompany(): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const j of allJobs) {
    counts[j.company.id] = (counts[j.company.id] ?? 0) + 1;
  }
  return counts;
}

export function jobsForCompany(companyId: string): Job[] {
  return allJobs
    .filter((j) => j.company.id === companyId)
    .sort((a, b) => b.postedAt.localeCompare(a.postedAt));
}

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

export function jobCountBySector(): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const j of jobs) {
    counts[j.sector] = (counts[j.sector] ?? 0) + 1;
  }
  return counts;
}

export const COMPANY_BAR_PALETTE = [
  "#1C3D5A",
  "#5A2A2A",
  "#2F4F3F",
  "#6B4423",
  "#4A3D5A",
  "#5A4A2A",
  "#2A4A5A",
  "#4A2A4A",
] as const;

export function companyBarColor(companyId: string): string {
  let h = 0;
  for (let i = 0; i < companyId.length; i++) {
    h = (h * 31 + companyId.charCodeAt(i)) | 0;
  }
  return COMPANY_BAR_PALETTE[Math.abs(h) % COMPANY_BAR_PALETTE.length];
}

export function sectorTileColor(sectorName: string): string {
  let h = 0;
  for (let i = 0; i < sectorName.length; i++) {
    h = (h * 31 + sectorName.charCodeAt(i)) | 0;
  }
  return COMPANY_BAR_PALETTE[Math.abs(h) % COMPANY_BAR_PALETTE.length];
}
