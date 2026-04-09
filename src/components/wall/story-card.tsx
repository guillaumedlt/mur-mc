import Image from "next/image";
import Link from "next/link";
import { Clock } from "iconoir-react";
import { type Story, formatStoryDate, storyCover } from "@/lib/stories";

type Variant = "feature" | "standard" | "horizontal" | "compact";

type Props = {
  story: Story;
  index?: number;
  variant?: Variant;
};

export function StoryCard({ story, variant = "standard" }: Props) {
  if (variant === "feature") return <FeatureCard story={story} />;
  if (variant === "horizontal") return <HorizontalCard story={story} />;
  if (variant === "compact") return <CompactCard story={story} />;
  return <StandardCard story={story} />;
}

/* ─── Feature card (hero du magazine) ─────────────────── */
function FeatureCard({ story }: { story: Story }) {
  return (
    <Link
      href={`/stories/${story.slug}`}
      className="group relative block bg-white border border-[var(--border)] rounded-2xl overflow-hidden h-full"
    >
      <div className="relative w-full h-full min-h-[320px] lg:min-h-[460px]">
        <Image
          src={storyCover(story, 1600, 900)}
          alt={story.title}
          fill
          priority
          sizes="(max-width: 1024px) 100vw, 720px"
          className="object-cover group-hover:scale-[1.02] transition-transform duration-700 ease-out"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-black/5" />

        <div className="absolute inset-x-0 bottom-0 p-5 sm:p-7 text-white">
          <span className="inline-flex items-center h-6 px-2.5 rounded-full bg-white/15 backdrop-blur-sm text-[11px] font-semibold uppercase tracking-[0.08em]">
            {story.category}
          </span>
          <h2 className="font-display text-[24px] sm:text-[30px] lg:text-[36px] leading-[1.08] tracking-[-0.015em] mt-3 max-w-2xl">
            {story.title}
          </h2>
          <p className="text-[13.5px] sm:text-[14px] text-white/85 leading-[1.55] mt-3 max-w-xl line-clamp-2">
            {story.excerpt}
          </p>
          <div className="flex items-center gap-3 mt-4 text-[11.5px] sm:text-[12px] text-white/70">
            <span>{story.authorName}</span>
            <span aria-hidden>·</span>
            <time dateTime={story.publishedAt}>
              {formatStoryDate(story.publishedAt)}
            </time>
            <span aria-hidden>·</span>
            <span className="inline-flex items-center gap-1">
              <Clock width={11} height={11} strokeWidth={2} />
              {story.readingMinutes} min
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}

/* ─── Standard card (grille verticale) ─────────────────── */
function StandardCard({ story }: { story: Story }) {
  return (
    <Link
      href={`/stories/${story.slug}`}
      className="group block bg-white border border-[var(--border)] rounded-2xl overflow-hidden hover:border-foreground/20 hover:shadow-[0_4px_24px_rgba(10,10,10,0.06)] transition-all"
    >
      <div className="relative aspect-[16/10] w-full overflow-hidden">
        <Image
          src={storyCover(story, 800, 500)}
          alt={story.title}
          fill
          sizes="(max-width: 1024px) 50vw, 360px"
          className="object-cover group-hover:scale-[1.03] transition-transform duration-500 ease-out"
        />
      </div>
      <div className="p-5 sm:p-6 flex flex-col">
        <div className="flex items-center justify-between gap-2">
          <span className="text-[10.5px] font-semibold uppercase tracking-[0.08em] text-[var(--accent)]">
            {story.category}
          </span>
          <span className="text-[10.5px] font-mono text-[var(--tertiary-foreground)] inline-flex items-center gap-1">
            <Clock width={10} height={10} strokeWidth={2} />
            {story.readingMinutes} min
          </span>
        </div>
        <h3 className="font-display text-[18px] sm:text-[20px] leading-[1.18] tracking-[-0.005em] text-foreground mt-2.5 line-clamp-2 group-hover:text-[var(--accent)] transition-colors">
          {story.title}
        </h3>
        <p className="text-[13px] text-muted-foreground leading-[1.55] mt-2 line-clamp-2">
          {story.excerpt}
        </p>
        <div className="flex items-center justify-between mt-4 pt-3 border-t border-[var(--border)] text-[11.5px] text-[var(--tertiary-foreground)]">
          <span className="font-medium text-foreground/70">
            {story.authorName}
          </span>
          <time dateTime={story.publishedAt} className="font-mono">
            {formatStoryDate(story.publishedAt)}
          </time>
        </div>
      </div>
    </Link>
  );
}

/* ─── Horizontal card (sidebar du hero) ────────────────── */
function HorizontalCard({ story }: { story: Story }) {
  return (
    <Link
      href={`/stories/${story.slug}`}
      className="group flex gap-4 bg-white border border-[var(--border)] rounded-2xl overflow-hidden p-4 hover:border-foreground/20 hover:shadow-[0_4px_24px_rgba(10,10,10,0.06)] transition-all h-full"
    >
      <div className="relative w-[120px] sm:w-[140px] shrink-0 rounded-xl overflow-hidden bg-[var(--background-alt)]">
        <Image
          src={storyCover(story, 400, 300)}
          alt={story.title}
          fill
          sizes="140px"
          className="object-cover group-hover:scale-[1.04] transition-transform duration-500 ease-out"
        />
      </div>
      <div className="flex flex-col flex-1 min-w-0 py-0.5">
        <span className="text-[10.5px] font-semibold uppercase tracking-[0.08em] text-[var(--accent)]">
          {story.category}
        </span>
        <h3 className="font-display text-[16px] sm:text-[18px] leading-[1.2] tracking-[-0.005em] text-foreground mt-1.5 line-clamp-2 group-hover:text-[var(--accent)] transition-colors">
          {story.title}
        </h3>
        <p className="text-[12.5px] text-muted-foreground leading-[1.5] mt-1.5 line-clamp-2 hidden sm:block">
          {story.excerpt}
        </p>
        <div className="flex-1" />
        <div className="flex items-center gap-2 mt-2 text-[11px] text-[var(--tertiary-foreground)]">
          <span>{story.authorName}</span>
          <span aria-hidden>·</span>
          <span className="inline-flex items-center gap-1">
            <Clock width={10} height={10} strokeWidth={2} />
            {story.readingMinutes} min
          </span>
        </div>
      </div>
    </Link>
  );
}

/* ─── Compact (sidebar related in article page) ────────── */
function CompactCard({ story }: { story: Story }) {
  return (
    <Link
      href={`/stories/${story.slug}`}
      className="group block bg-white border border-[var(--border)] rounded-2xl overflow-hidden hover:border-foreground/20 transition-colors"
    >
      <div className="relative aspect-[16/10] w-full overflow-hidden">
        <Image
          src={storyCover(story, 400, 250)}
          alt={story.title}
          fill
          sizes="(max-width: 640px) 100vw, 240px"
          className="object-cover group-hover:scale-[1.04] transition-transform duration-500 ease-out"
        />
      </div>
      <div className="p-4">
        <span className="text-[10px] font-semibold uppercase tracking-[0.08em] text-[var(--accent)]">
          {story.category}
        </span>
        <h4 className="font-display text-[14px] leading-[1.25] tracking-[-0.005em] text-foreground mt-1 line-clamp-2 group-hover:text-[var(--accent)] transition-colors">
          {story.title}
        </h4>
      </div>
    </Link>
  );
}
