import { createClient } from "./server";
import type { Company, Job, Sector, Locale, WorkTime, JobType, ExperienceLevel } from "../data";
import type { Story } from "../stories";

/**
 * Charge toutes les offres publiees depuis Supabase, avec leur entreprise.
 * Utilisé par la home page (mur) et le sitemap.
 */
export async function fetchAllJobs(): Promise<Job[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("jobs")
    .select("*, companies(*)")
    .eq("status", "published")
    .order("published_at", { ascending: false });

  if (error || !data) return [];

  return data.map(mapJob);
}

/**
 * Charge une offre par slug.
 */
export async function fetchJobBySlug(slug: string): Promise<Job | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("jobs")
    .select("*, companies(*)")
    .eq("slug", slug)
    .single();

  if (error || !data) return null;
  return mapJob(data);
}

/**
 * Charge toutes les entreprises.
 */
export async function fetchAllCompanies(): Promise<Company[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("companies")
    .select("*")
    .order("name");

  if (error || !data) return [];
  return data.map(mapCompany);
}

/**
 * Charge une entreprise par slug.
 */
export async function fetchCompanyBySlug(
  slug: string,
): Promise<Company | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("companies")
    .select("*")
    .eq("slug", slug)
    .single();

  if (error || !data) return null;
  return mapCompany(data);
}

/**
 * Charge les offres d'une entreprise.
 */
export async function fetchJobsForCompany(companyId: string): Promise<Job[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("jobs")
    .select("*, companies(*)")
    .eq("company_id", companyId)
    .eq("status", "published")
    .order("published_at", { ascending: false });

  if (error || !data) return [];
  return data.map(mapJob);
}

/* ─── Stories ──────────────────────────────────────────────── */

/**
 * Charge tous les articles publies depuis Supabase.
 */
export async function fetchAllStories(): Promise<Story[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("stories")
    .select("*")
    .order("published_at", { ascending: false });

  if (error || !data) return [];
  return data.map(mapStory);
}

/**
 * Charge un article par slug.
 */
export async function fetchStoryBySlug(slug: string): Promise<Story | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("stories")
    .select("*")
    .eq("slug", slug)
    .single();

  if (error || !data) return null;
  return mapStory(data);
}

/* ─── Mappers DB row → type app ─────────────────────────── */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapCompany(row: any): Company {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    logoColor: row.logo_color ?? "#1C3D5A",
    initials: row.initials ?? row.name?.slice(0, 2)?.toUpperCase() ?? "??",
    domain: row.domain ?? undefined,
    sector: (row.sector ?? "Tech & Digital") as Sector,
    size: row.size ?? "",
    description: row.description ?? "",
    tagline: row.tagline ?? undefined,
    hasCover: row.has_cover ?? false,
    positioning: row.positioning ?? undefined,
    culture: row.culture ?? undefined,
    location: row.location ?? "Monaco",
    website: row.website ?? undefined,
    founded: row.founded ?? undefined,
    perks: row.perks ?? [],
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapJob(row: any): Job {
  const company = row.companies ? mapCompany(row.companies) : {
    id: row.company_id,
    slug: "unknown",
    name: "Entreprise",
    logoColor: "#1C3D5A",
    initials: "??",
    sector: "Tech & Digital" as Sector,
    size: "",
    description: "",
    location: "Monaco",
    perks: [],
  };

  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    company,
    type: (row.type ?? "CDI") as JobType,
    level: (row.level ?? "Confirmé") as ExperienceLevel,
    sector: (row.sector ?? company.sector) as Sector,
    location: row.location ?? "Monaco",
    lat: row.lat ?? 43.738,
    lng: row.lng ?? 7.425,
    remote: row.remote ?? "Sur site",
    workTime: (row.work_time ?? "Temps plein") as WorkTime,
    salaryMin: row.salary_min ?? undefined,
    salaryMax: row.salary_max ?? undefined,
    currency: "EUR",
    postedAt: row.published_at ?? row.created_at ?? new Date().toISOString(),
    lang: (row.lang ?? "fr") as Locale,
    languages: row.languages ?? ["Français"],
    tags: row.tags ?? [],
    shortDescription: row.short_description ?? "",
    description: row.description ?? "",
    responsibilities: row.responsibilities ?? [],
    requirements: row.requirements ?? [],
    benefits: row.benefits ?? [],
    featured: row.featured ?? false,
    urgent: row.urgent ?? false,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapStory(row: any): Story {
  return {
    id: row.id,
    slug: row.slug,
    category: row.category ?? "Marché",
    title: row.title,
    excerpt: row.excerpt ?? "",
    lead: row.lead ?? "",
    body: Array.isArray(row.body) ? row.body : [],
    authorName: row.author_name ?? "Mur.mc",
    authorRole: row.author_role ?? "Rédaction",
    publishedAt: row.published_at ?? new Date().toISOString(),
    updatedAt: row.updated_at ?? undefined,
    readingMinutes: row.reading_minutes ?? 5,
    featured: row.featured ?? false,
    tags: row.tags ?? [],
  };
}
