import type { MetadataRoute } from "next";
import { fetchAllCompanies, fetchAllJobs } from "@/lib/supabase/queries";
import { stories } from "@/lib/stories";

const SITE_URL = "https://mur.mc";

export const revalidate = 3600; // 1h

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [allJobs, companies] = await Promise.all([
    fetchAllJobs(),
    fetchAllCompanies(),
  ]);

  const now = new Date();

  return [
    {
      url: SITE_URL,
      lastModified: now,
      changeFrequency: "hourly",
      priority: 1,
    },
    {
      url: `${SITE_URL}/entreprises`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.7,
    },
    {
      url: `${SITE_URL}/stories`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.7,
    },
    ...companies.map((c) => ({
      url: `${SITE_URL}/entreprises/${c.slug}`,
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority: 0.6,
    })),
    ...allJobs.map((j) => ({
      url: `${SITE_URL}/jobs/${j.slug}`,
      lastModified: new Date(j.postedAt),
      changeFrequency: "daily" as const,
      priority: 0.8,
    })),
    ...stories.map((s) => ({
      url: `${SITE_URL}/stories/${s.slug}`,
      lastModified: new Date(s.updatedAt ?? s.publishedAt),
      changeFrequency: "monthly" as const,
      priority: 0.7,
    })),
  ];
}
