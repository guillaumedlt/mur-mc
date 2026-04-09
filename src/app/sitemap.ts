import type { MetadataRoute } from "next";
import { allJobs, companies } from "@/lib/data";
import { stories } from "@/lib/stories";

const SITE_URL = "https://mur.mc";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  const home: MetadataRoute.Sitemap[number] = {
    url: SITE_URL,
    lastModified: now,
    changeFrequency: "hourly",
    priority: 1,
  };
  const entreprises: MetadataRoute.Sitemap[number] = {
    url: `${SITE_URL}/entreprises`,
    lastModified: now,
    changeFrequency: "daily",
    priority: 0.7,
  };
  const magazine: MetadataRoute.Sitemap[number] = {
    url: `${SITE_URL}/stories`,
    lastModified: now,
    changeFrequency: "weekly",
    priority: 0.7,
  };
  const jobs: MetadataRoute.Sitemap = allJobs.map((j) => ({
    url: `${SITE_URL}/jobs/${j.slug}`,
    lastModified: new Date(j.postedAt),
    changeFrequency: "daily",
    priority: 0.8,
  }));
  const companyPages: MetadataRoute.Sitemap = companies.map((c) => ({
    url: `${SITE_URL}/entreprises/${c.slug}`,
    lastModified: now,
    changeFrequency: "weekly",
    priority: 0.6,
  }));
  const storyPages: MetadataRoute.Sitemap = stories.map((s) => ({
    url: `${SITE_URL}/stories/${s.slug}`,
    lastModified: new Date(s.updatedAt ?? s.publishedAt),
    changeFrequency: "monthly",
    priority: 0.7,
  }));
  return [
    home,
    entreprises,
    magazine,
    ...companyPages,
    ...jobs,
    ...storyPages,
  ];
}
