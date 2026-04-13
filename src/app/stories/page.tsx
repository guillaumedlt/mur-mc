import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight, Mail, Sparks } from "iconoir-react";
import { Shell } from "@/components/wall/shell";
import { StoryCard } from "@/components/wall/story-card";
import { fetchAllJobs, fetchAllStories } from "@/lib/supabase/queries";
import type { Story } from "@/lib/stories";

const SITE_URL = "https://mur.mc";

export const metadata: Metadata = {
  title: "Magazine — Enquetes, donnees et coulisses de l'emploi a Monaco",
  description:
    "Le magazine Mur.mc : salaires 2026, secteurs qui recrutent, vie quotidienne en Principaute, conseils carriere. Donnees exclusives sur le marche monegasque.",
  alternates: { canonical: "/stories" },
  keywords: [
    "magazine emploi Monaco",
    "salaires Monaco 2026",
    "marche du travail Monaco",
    "recrutement Monaco",
    "carriere Principaute",
    "travailler Monaco",
    "frontalier Monaco",
  ],
  openGraph: {
    type: "website",
    url: `${SITE_URL}/stories`,
    siteName: "Mur.mc",
    title: "Magazine — Mur.mc",
    description: "Enquetes, donnees et coulisses de l'emploi a Monaco.",
  },
};

export const revalidate = 300;

export default async function StoriesPage() {
  const [stories, allJobs] = await Promise.all([
    fetchAllStories(),
    fetchAllJobs(),
  ]);

  const featured = stories.find((s) => s.featured) ?? stories[0] ?? null;
  const rest = featured ? stories.filter((s) => s.id !== featured.id) : [];
  const sideStories = rest.slice(0, 2);
  const remainingAfterHero = rest.slice(2);

  // Group by category
  const categories = Array.from(new Set(stories.map((s) => s.category)));
  const byCategory: Record<string, Story[]> = {};
  for (const cat of categories) {
    byCategory[cat] = stories.filter((s) => s.category === cat);
  }

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Blog",
    name: "Magazine Mur.mc",
    url: `${SITE_URL}/stories`,
    description: "Enquetes, donnees et coulisses de l'emploi a Monaco.",
    inLanguage: "fr-FR",
    publisher: { "@type": "Organization", name: "Mur.mc", url: SITE_URL },
    blogPost: stories.map((s) => ({
      "@type": "BlogPosting",
      headline: s.title,
      url: `${SITE_URL}/stories/${s.slug}`,
      datePublished: s.publishedAt,
      author: { "@type": "Person", name: s.authorName },
    })),
  };

  return (
    <Shell jobs={allJobs}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div className="max-w-[1100px] mx-auto">
        {/* Header editorial */}
        <header className="bg-white border border-[var(--border)] rounded-2xl px-5 sm:px-7 lg:px-9 py-8 lg:py-10 mb-3">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <p className="ed-label-sm text-[var(--accent)]">Magazine</p>
              <h1 className="font-display text-[28px] sm:text-[34px] lg:text-[40px] tracking-[-0.02em] text-foreground mt-2 leading-[1.08]">
                Le mur, raconte.
              </h1>
              <p className="text-[15px] text-muted-foreground mt-3 max-w-xl leading-[1.7]">
                Enquetes, donnees exclusives et coulisses du marche de l&apos;emploi
                monegasque. Salaires, secteurs, temoignages — tout pour comprendre
                et reussir a Monaco.
              </p>
            </div>
            <div className="flex items-center gap-2 mt-2">
              <span className="wall-badge" data-tone="accent">
                <Sparks /> {stories.length} articles
              </span>
            </div>
          </div>

          {/* Category pills */}
          <div className="flex flex-wrap items-center gap-1.5 mt-5">
            {categories.map((cat) => (
              <span
                key={cat}
                className="h-8 px-3 rounded-full text-[12px] border border-[var(--border)] bg-[var(--background-alt)]/50 text-foreground/70 inline-flex items-center gap-1.5"
              >
                {cat}
                <span className="font-mono text-[10px] text-foreground/40">
                  {byCategory[cat].length}
                </span>
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
            {/* Hero : featured (3/5) + 2 side stories (2/5) */}
            {featured && (
              <div className="grid grid-cols-1 lg:grid-cols-5 gap-3 mb-3">
                <div className="lg:col-span-3">
                  <StoryCard story={featured} variant="feature" />
                </div>
                <div className="lg:col-span-2 flex flex-col gap-3">
                  {sideStories.map((s) => (
                    <StoryCard key={s.id} story={s} variant="horizontal" />
                  ))}

                  {/* Mini newsletter CTA in the sidebar gap */}
                  {sideStories.length < 2 && (
                    <div className="bg-foreground rounded-2xl p-5 text-background flex-1 flex flex-col justify-center">
                      <Mail width={20} height={20} strokeWidth={1.8} className="text-background/70" />
                      <p className="font-display text-[16px] mt-3">
                        Restez informe sur le marche monegasque.
                      </p>
                      <p className="text-[12px] text-background/60 mt-1">
                        contact@mur.mc
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Articles par categorie */}
            {categories.map((cat) => {
              const catStories = byCategory[cat].filter(
                (s) => s.id !== featured?.id,
              );
              if (catStories.length === 0) return null;
              return (
                <section
                  key={cat}
                  className="bg-white border border-[var(--border)] rounded-2xl px-5 sm:px-7 lg:px-9 py-6 lg:py-8 mb-3"
                >
                  <div className="flex items-baseline justify-between mb-5">
                    <div className="flex items-baseline gap-2.5">
                      <h2 className="font-display text-[22px] tracking-[-0.01em] text-foreground">
                        {cat}
                      </h2>
                      <span className="text-[11px] font-mono text-foreground/40">
                        {catStories.length} article{catStories.length > 1 ? "s" : ""}
                      </span>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {catStories.map((s) => (
                      <StoryCard key={s.id} story={s} variant="standard" />
                    ))}
                  </div>
                </section>
              );
            })}

            {/* Remaining uncategorized (if any) */}
            {remainingAfterHero.length > 0 && categories.length <= 1 && (
              <section className="bg-white border border-[var(--border)] rounded-2xl px-5 sm:px-7 lg:px-9 py-6 lg:py-8 mb-3">
                <h2 className="font-display text-[22px] tracking-[-0.01em] text-foreground mb-5">
                  Tous les articles
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {remainingAfterHero.map((s) => (
                    <StoryCard key={s.id} story={s} variant="standard" />
                  ))}
                </div>
              </section>
            )}

            {/* Bottom CTA */}
            <div className="bg-foreground rounded-2xl px-5 sm:px-7 lg:px-9 py-8 lg:py-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5">
              <div>
                <h2 className="font-display text-[22px] sm:text-[26px] tracking-[-0.015em] text-background">
                  Vous recrutez a Monaco ?
                </h2>
                <p className="text-[14px] text-background/65 mt-1.5 max-w-md">
                  Publiez vos offres sur le mur et touchez les meilleurs talents
                  de la Principaute.
                </p>
              </div>
              <Link
                href="/inscription"
                className="h-11 px-5 rounded-full bg-background text-foreground text-[13.5px] font-medium hover:bg-background/90 transition-colors inline-flex items-center gap-2 shrink-0"
              >
                Commencer gratuitement
                <ArrowUpRight width={13} height={13} strokeWidth={2.2} />
              </Link>
            </div>
          </>
        )}
      </div>
    </Shell>
  );
}
