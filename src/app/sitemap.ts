import type { MetadataRoute } from "next";
import { fetchAllCompanies, fetchAllJobs, fetchAllStories } from "@/lib/supabase/queries";
import { METIER_SLUGS } from "./emploi-monaco/metier/metiers";
import { CROSS_SLUGS } from "./emploi-monaco/metier/cross";

const SITE_URL = "https://mur.mc";

const SEO_SECTORS = [
  "banque-finance",
  "hotellerie-restauration",
  "tech-digital",
  "yachting",
  "luxe-retail",
  "immobilier",
  "juridique",
  "communication-marketing",
  "btp-construction",
  "ressources-humaines",
];

const SEO_CONTRACTS = ["cdi", "cdd", "stage", "alternance", "freelance"];

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [allJobs, companies, stories] = await Promise.all([
    fetchAllJobs(),
    fetchAllCompanies(),
    fetchAllStories(),
  ]);

  const now = new Date();

  return [
    // Core pages
    { url: SITE_URL, lastModified: now, changeFrequency: "hourly", priority: 1 },
    { url: `${SITE_URL}/emploi-monaco`, lastModified: now, changeFrequency: "hourly", priority: 0.95 },
    { url: `${SITE_URL}/entreprises`, lastModified: now, changeFrequency: "daily", priority: 0.7 },
    { url: `${SITE_URL}/stories`, lastModified: now, changeFrequency: "weekly", priority: 0.7 },
    { url: `${SITE_URL}/travailler-monaco`, lastModified: now, changeFrequency: "monthly", priority: 0.9 },
    { url: `${SITE_URL}/tarifs`, lastModified: now, changeFrequency: "monthly", priority: 0.5 },
    { url: `${SITE_URL}/a-propos`, lastModified: now, changeFrequency: "monthly", priority: 0.4 },

    // SEO sector landing pages
    ...SEO_SECTORS.map((s) => ({
      url: `${SITE_URL}/emploi-monaco/${s}`,
      lastModified: now,
      changeFrequency: "daily" as const,
      priority: 0.85,
    })),

    // SEO contract type landing pages
    ...SEO_CONTRACTS.map((c) => ({
      url: `${SITE_URL}/emploi-monaco/${c}`,
      lastModified: now,
      changeFrequency: "daily" as const,
      priority: 0.8,
    })),

    // SEO metier hub + individual metier pages
    { url: `${SITE_URL}/emploi-monaco/metier`, lastModified: now, changeFrequency: "daily" as const, priority: 0.85 },
    ...METIER_SLUGS.map((s) => ({
      url: `${SITE_URL}/emploi-monaco/metier/${s}`,
      lastModified: now,
      changeFrequency: "daily" as const,
      priority: 0.8,
    })),

    // SEO cross pages metier × secteur (long-tail)
    ...CROSS_SLUGS.map((s) => ({
      url: `${SITE_URL}/emploi-monaco/metier/${s}`,
      lastModified: now,
      changeFrequency: "daily" as const,
      priority: 0.7,
    })),

    // Company pages
    ...companies.map((c) => ({
      url: `${SITE_URL}/entreprises/${c.slug}`,
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority: 0.6,
    })),

    // Job pages (highest priority for SEO)
    ...allJobs.map((j) => ({
      url: `${SITE_URL}/jobs/${j.slug}`,
      lastModified: new Date(j.postedAt),
      changeFrequency: "daily" as const,
      priority: 0.9,
    })),

    // Magazine articles
    ...stories.map((s) => ({
      url: `${SITE_URL}/stories/${s.slug}`,
      lastModified: new Date(s.updatedAt ?? s.publishedAt),
      changeFrequency: "monthly" as const,
      priority: 0.7,
    })),
  ];
}
