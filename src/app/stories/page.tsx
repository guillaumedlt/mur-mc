import type { Metadata } from "next";
import { Shell } from "@/components/wall/shell";
import { StoryCard } from "@/components/wall/story-card";
import { fetchAllJobs, fetchAllStories } from "@/lib/supabase/queries";

const SITE_URL = "https://mur.mc";

export const metadata: Metadata = {
  title: "Magazine — Stories sur l'emploi à Monaco",
  description:
    "Le magazine Mur.mc : enquêtes, reportages et données sur le marché du travail monégasque. Banques privées, palaces, yachting, tech, luxe.",
  alternates: { canonical: "/stories" },
  keywords: [
    "magazine emploi Monaco",
    "marché du travail Monaco",
    "salaires Monaco",
    "recrutement Monaco",
    "carrière Principauté",
    "yachting jobs",
    "compliance officer Monaco",
  ],
  openGraph: {
    type: "website",
    url: `${SITE_URL}/stories`,
    siteName: "Mur.mc",
    title: "Magazine — Mur.mc",
    description:
      "Enquêtes, reportages et données sur le marché du travail monégasque.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Magazine — Mur.mc",
    description:
      "Enquêtes, reportages et données sur le marché du travail monégasque.",
  },
};

import type { Story } from "@/lib/stories";

function magazineJsonLd(storyList: Story[]) {
  return {
    "@context": "https://schema.org",
    "@type": "Blog",
    name: "Magazine Mur.mc",
    url: `${SITE_URL}/stories`,
    description:
      "Enquêtes, reportages et données sur le marché du travail monégasque.",
    inLanguage: "fr-FR",
    publisher: {
      "@type": "Organization",
      name: "Mur.mc",
      url: SITE_URL,
    },
    blogPost: storyList.map((s) => ({
      "@type": "BlogPosting",
      headline: s.title,
      url: `${SITE_URL}/stories/${s.slug}`,
      datePublished: s.publishedAt,
      author: { "@type": "Person", name: s.authorName },
    })),
  };
}

function breadcrumbJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Mur.mc",
        item: SITE_URL,
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "Magazine",
        item: `${SITE_URL}/stories`,
      },
    ],
  };
}

export const revalidate = 300;

export default async function StoriesPage() {
  const [stories, allJobs] = await Promise.all([
    fetchAllStories(),
    fetchAllJobs(),
  ]);
  const featured = stories.find((s) => s.featured) ?? stories[0] ?? null;
  const rest = featured
    ? stories.filter((s) => s.id !== featured.id)
    : [];
  const sideStories = rest.slice(0, 2);
  const grid = rest.slice(2);
  const categories = Array.from(new Set(stories.map((s) => s.category)));

  return (
    <Shell jobs={allJobs}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(magazineJsonLd(stories)) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd()) }}
      />

      <div className="max-w-[1100px] mx-auto">
        {/* Header */}
        <header className="bg-white border border-[var(--border)] rounded-2xl px-5 sm:px-7 lg:px-9 py-6 lg:py-7 mb-3">
          <p className="ed-label-sm">Magazine</p>
          <h1 className="font-display text-[24px] sm:text-[28px] lg:text-[30px] tracking-[-0.015em] text-foreground mt-1">
            Le mur, raconté.
          </h1>
          <p className="text-[14px] text-muted-foreground mt-2 max-w-xl">
            Enquêtes, reportages et données sur le marché du travail monégasque.
          </p>
          <div className="flex flex-wrap items-center gap-1.5 mt-4">
            {categories.map((cat) => (
              <span
                key={cat}
                className="h-7 px-2.5 rounded-full text-[11.5px] border bg-white text-foreground/75 border-[var(--border)]"
              >
                {cat}
              </span>
            ))}
          </div>
        </header>

        {stories.length === 0 ? (
          <div className="bg-white border border-[var(--border)] rounded-2xl px-5 sm:px-7 lg:px-9 py-16 text-center">
            <p className="font-display italic text-[18px] text-foreground">
              Aucun article pour l&apos;instant.
            </p>
            <p className="text-[13px] text-muted-foreground mt-2">
              Les premiers articles arrivent bientot.
            </p>
          </div>
        ) : (
          <>
            {/* Hero section : feature (2/3) + 2 side cards (1/3) */}
            {featured && (
              <div className="grid grid-cols-1 lg:grid-cols-5 gap-3 mb-3">
                <div className="lg:col-span-3">
                  <StoryCard story={featured} variant="feature" />
                </div>
                <div className="lg:col-span-2 flex flex-col gap-3">
                  {sideStories.map((s) => (
                    <StoryCard key={s.id} story={s} variant="horizontal" />
                  ))}
                </div>
              </div>
            )}

            {/* Section "Tous les articles" */}
            {grid.length > 0 && (
              <div className="bg-white border border-[var(--border)] rounded-2xl px-5 sm:px-7 lg:px-9 py-6 lg:py-7">
                <h2 className="font-display text-[22px] tracking-[-0.01em] text-foreground mb-5">
                  Tous les articles
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {grid.map((s) => (
                    <StoryCard key={s.id} story={s} variant="standard" />
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </Shell>
  );
}
