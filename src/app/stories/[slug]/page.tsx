import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Clock, ShareIos } from "iconoir-react";
import { allJobs } from "@/lib/data";
import {
  type Story,
  formatStoryDate,
  getStory,
  relatedStories,
  storyCover,
  stories,
} from "@/lib/stories";
import { Shell } from "@/components/wall/shell";
import { StoryCard } from "@/components/wall/story-card";

const SITE_URL = "https://mur.mc";

export function generateStaticParams() {
  return stories.map((s) => ({ slug: s.slug }));
}

export async function generateMetadata(
  props: PageProps<"/stories/[slug]">,
): Promise<Metadata> {
  const { slug } = await props.params;
  const story = getStory(slug);
  if (!story) return { title: "Article introuvable" };
  const url = `${SITE_URL}/stories/${story.slug}`;
  const cover = storyCover(story, 1200, 630);
  return {
    title: story.title,
    description: story.excerpt,
    keywords: story.tags,
    authors: [{ name: story.authorName }],
    alternates: { canonical: `/stories/${story.slug}` },
    openGraph: {
      type: "article",
      url,
      title: story.title,
      description: story.excerpt,
      siteName: "Mur.mc",
      locale: "fr_FR",
      publishedTime: story.publishedAt,
      modifiedTime: story.updatedAt ?? story.publishedAt,
      authors: [story.authorName],
      tags: story.tags,
      images: [
        {
          url: cover,
          width: 1200,
          height: 630,
          alt: story.title,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: story.title,
      description: story.excerpt,
      images: [cover],
    },
    robots: { index: true, follow: true },
  };
}

function articleJsonLd(story: Story) {
  return {
    "@context": "https://schema.org",
    "@type": "NewsArticle",
    headline: story.title,
    description: story.excerpt,
    image: [storyCover(story, 1600, 900), storyCover(story, 1200, 630)],
    datePublished: story.publishedAt,
    dateModified: story.updatedAt ?? story.publishedAt,
    author: [
      {
        "@type": "Person",
        name: story.authorName,
        jobTitle: story.authorRole,
      },
    ],
    publisher: {
      "@type": "Organization",
      name: "Mur.mc",
      url: SITE_URL,
      logo: {
        "@type": "ImageObject",
        url: `${SITE_URL}/icon.png`,
      },
    },
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": `${SITE_URL}/stories/${story.slug}`,
    },
    inLanguage: "fr-FR",
    articleSection: story.category,
    keywords: story.tags.join(", "),
    wordCount: story.body
      .map((b) => ("text" in b ? b.text.length : 0))
      .reduce((a, b) => a + b, 0),
  };
}

function breadcrumbJsonLd(story: Story) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Mur.mc", item: SITE_URL },
      {
        "@type": "ListItem",
        position: 2,
        name: "Magazine",
        item: `${SITE_URL}/stories`,
      },
      {
        "@type": "ListItem",
        position: 3,
        name: story.title,
        item: `${SITE_URL}/stories/${story.slug}`,
      },
    ],
  };
}

export default async function StoryPage(props: PageProps<"/stories/[slug]">) {
  const { slug } = await props.params;
  const story = getStory(slug);
  if (!story) notFound();

  const related = relatedStories(story, 3);
  const cover = storyCover(story, 1600, 900);

  return (
    <Shell jobs={allJobs}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd(story)) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(breadcrumbJsonLd(story)),
        }}
      />

      <div className="max-w-[760px] mx-auto">
        <Link
          href="/stories"
          className="inline-flex items-center gap-1.5 text-[12.5px] text-foreground/55 hover:text-foreground transition-colors mb-3 px-1"
        >
          <ArrowLeft width={12} height={12} strokeWidth={2} />
          Magazine
        </Link>

        {/* Hero card */}
        <article className="bg-white border border-[var(--border)] rounded-2xl overflow-hidden">
          {/* Cover */}
          <div className="relative w-full h-[220px] sm:h-[300px] lg:h-[360px]">
            <Image
              src={cover}
              alt={story.title}
              fill
              priority
              sizes="(max-width: 1024px) 100vw, 760px"
              className="object-cover"
            />
          </div>

          {/* Header */}
          <header className="px-5 sm:px-7 lg:px-9 pt-6 sm:pt-8 pb-5 sm:pb-6">
            <div className="flex items-center gap-3 text-[12px] text-foreground/60 flex-wrap">
              <span className="inline-flex items-center h-6 px-2.5 rounded-full bg-[var(--accent)]/10 text-[var(--accent)] text-[11px] font-semibold uppercase tracking-[0.08em]">
                {story.category}
              </span>
              <time dateTime={story.publishedAt}>
                {formatStoryDate(story.publishedAt)}
              </time>
              <span>·</span>
              <span className="inline-flex items-center gap-1">
                <Clock width={11} height={11} strokeWidth={2} />
                {story.readingMinutes} min de lecture
              </span>
            </div>

            <h1 className="font-display text-[28px] sm:text-[34px] lg:text-[40px] leading-[1.08] tracking-[-0.015em] text-foreground mt-4">
              {story.title}
            </h1>

            <p
              className="font-display italic text-[18px] leading-[1.55] text-foreground/85 mt-5"
              role="doc-subtitle"
            >
              {story.lead}
            </p>

            {/* Author + share */}
            <div className="flex items-center justify-between mt-7 pt-5 border-t border-[var(--border)]">
              <div className="flex items-center gap-3">
                <div
                  className="size-10 rounded-full flex items-center justify-center text-white font-display text-[14px] font-medium"
                  style={{
                    background: `linear-gradient(155deg, var(--accent), #122a3f)`,
                  }}
                  aria-hidden
                >
                  {initials(story.authorName)}
                </div>
                <div>
                  <div className="text-[13px] font-medium text-foreground">
                    {story.authorName}
                  </div>
                  <div className="text-[11.5px] text-muted-foreground">
                    {story.authorRole}
                  </div>
                </div>
              </div>
              <button
                type="button"
                className="h-8 px-3 rounded-full border border-[var(--border)] bg-white text-[12px] text-foreground/75 hover:text-foreground hover:bg-[var(--background-alt)] transition-colors flex items-center gap-1.5"
              >
                <ShareIos width={12} height={12} strokeWidth={2} />
                Partager
              </button>
            </div>
          </header>

          {/* Body */}
          <div className="px-5 sm:px-7 lg:px-9 pb-10 lg:pb-12 prose-mur">
            {story.body.map((block, i) => {
              if (block.type === "h2") {
                return (
                  <h2
                    key={i}
                    className="font-display text-[26px] leading-[1.15] tracking-[-0.01em] text-foreground mt-12 mb-3 first:mt-0"
                  >
                    {block.text}
                  </h2>
                );
              }
              if (block.type === "quote") {
                return (
                  <blockquote
                    key={i}
                    className="my-10 border-l-[3px] border-[var(--accent)] pl-6"
                  >
                    <p className="font-display italic text-[22px] leading-[1.35] text-foreground tracking-[-0.005em]">
                      « {block.text} »
                    </p>
                    {block.author && (
                      <footer className="mt-3 text-[12.5px] text-muted-foreground">
                        — {block.author}
                      </footer>
                    )}
                  </blockquote>
                );
              }
              return (
                <p
                  key={i}
                  className="text-[16px] leading-[1.75] text-foreground/88 mt-5 first:mt-0"
                >
                  {block.text}
                </p>
              );
            })}

            {/* Tags */}
            {story.tags.length > 0 && (
              <div className="mt-12 pt-6 border-t border-[var(--border)] flex flex-wrap items-center gap-1.5">
                <span className="ed-label-sm pr-2">Sujets</span>
                {story.tags.map((t) => (
                  <span
                    key={t}
                    className="h-6 px-2.5 rounded-full text-[11px] bg-[var(--background-alt)] text-foreground/75"
                  >
                    #{t}
                  </span>
                ))}
              </div>
            )}
          </div>
        </article>

        {/* Related */}
        {related.length > 0 && (
          <section className="mt-3 bg-white border border-[var(--border)] rounded-2xl px-5 sm:px-7 lg:px-9 py-6 lg:py-8">
            <h2 className="font-display text-[22px] tracking-[-0.01em] text-foreground mb-5">
              À lire aussi
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {related.map((r) => (
                <StoryCard
                  key={r.id}
                  story={r}
                  variant="compact"
                />
              ))}
            </div>
          </section>
        )}
      </div>
    </Shell>
  );
}

function initials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}
