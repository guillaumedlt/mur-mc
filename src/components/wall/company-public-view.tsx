"use client";

import Image from "next/image";
import {
  Calendar,
  Check,
  Globe,
  Group,
  MapPin,
  Sparks,
} from "iconoir-react";
import type { Company, Job } from "@/lib/data";
import { CompanyLogo } from "./company-logo";
import { JobCard } from "./job-card";

type CompanyBlock = NonNullable<Company["blocks"]>[number];

type Props = {
  company: Company;
  openings: Job[];
};

function fallbackCover(company: Company): string {
  return `https://picsum.photos/seed/${company.slug}-cover/1600/520`;
}

export function CompanyPublicView({ company, openings }: Props) {
  const blocks = company.blocks ?? [];
  const hasCover = company.hasCover || !!company.coverUrl;

  return hasCover ? (
    <RichCompany company={company} openings={openings} blocks={blocks} />
  ) : (
    <SimpleCompany company={company} openings={openings} blocks={blocks} />
  );
}

/* ─── Rich mode ──────────────────────────────────────────── */

function RichCompany({
  company,
  openings,
  blocks,
}: {
  company: Company;
  openings: Job[];
  blocks: CompanyBlock[];
}) {
  const cover = company.coverUrl ?? fallbackCover(company);
  const isDataUrl = cover.startsWith("data:");

  return (
    <div className="flex flex-col gap-3">
      <header className="bg-white border border-[var(--border)] rounded-2xl overflow-hidden">
        <div className="relative h-[180px] sm:h-[220px] lg:h-[260px] w-full">
          {isDataUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={cover}
              alt={`${company.name} — couverture`}
              className="absolute inset-0 w-full h-full object-cover"
            />
          ) : (
            <Image
              src={cover}
              alt={`${company.name} — couverture`}
              fill
              priority
              sizes="(max-width: 1280px) 100vw, 1100px"
              className="object-cover"
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-b from-black/0 via-black/0 to-black/35" />
          {company.tagline && (
            <div className="absolute top-6 right-6 max-w-[360px]">
              <p className="font-display italic text-[15px] text-white leading-snug drop-shadow-[0_1px_4px_rgba(0,0,0,0.5)]">
                « {company.tagline} »
              </p>
            </div>
          )}
        </div>
        <div className="px-5 sm:px-7 lg:px-9 pb-7 -mt-10 relative">
          <div className="flex items-end gap-3 sm:gap-5">
            <div className="rounded-[18px] sm:rounded-[22px] p-1 bg-white shadow-[0_8px_30px_-8px_rgba(10,10,10,0.25)] shrink-0">
              {company.logoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={company.logoUrl}
                  alt={company.name}
                  className="size-16 rounded-[14px] object-cover"
                />
              ) : (
                <CompanyLogo
                  name={company.name}
                  domain={company.domain}
                  color={company.logoColor}
                  initials={company.initials}
                  size={64}
                  radius={14}
                />
              )}
            </div>
            <div className="min-w-0 flex-1 pb-2">
              <p className="ed-label-sm">{company.sector}</p>
              <h1 className="font-display text-[24px] sm:text-[28px] lg:text-[34px] leading-[1.08] tracking-[-0.015em] text-foreground mt-1">
                {company.name}
              </h1>
            </div>
            <div className="hidden md:flex shrink-0 pb-2">
              <span
                className="wall-badge"
                data-tone={openings.length > 0 ? "accent" : "muted"}
              >
                <Sparks /> {openings.length} poste{openings.length > 1 ? "s" : ""} ouvert
                {openings.length > 1 ? "s" : ""}
              </span>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2 mt-5 text-[12.5px] text-foreground/65">
            <Stat icon={<MapPin width={12} height={12} strokeWidth={2} />}>
              {company.location}
            </Stat>
            {company.size && (
              <Stat icon={<Group width={12} height={12} strokeWidth={2} />}>
                {company.size} collaborateurs
              </Stat>
            )}
            {company.founded && (
              <Stat icon={<Calendar width={12} height={12} strokeWidth={2} />}>
                Fondée en {company.founded}
              </Stat>
            )}
            {company.website && (
              <a
                href={`https://${company.website}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-[var(--accent)] hover:underline underline-offset-2"
              >
                <Globe width={12} height={12} strokeWidth={2} />
                {company.website}
              </a>
            )}
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 items-start">
        <div className="lg:col-span-2 flex flex-col gap-3">
          <article className="bg-white border border-[var(--border)] rounded-2xl px-5 sm:px-7 lg:px-9 py-6 lg:py-9">
            <Section title="L'entreprise">
              <p className="text-[15px] leading-[1.75] text-foreground/85 first-letter:font-display first-letter:text-[44px] first-letter:float-left first-letter:leading-[0.9] first-letter:mr-2 first-letter:mt-1.5">
                {company.description}
              </p>
            </Section>
            {company.positioning && (
              <Section title="Positionnement marché">
                <p className="text-[14.5px] leading-[1.75] text-foreground/82">
                  {company.positioning}
                </p>
              </Section>
            )}
            {company.culture && (
              <Section title="Culture & environnement">
                <p className="text-[14.5px] leading-[1.75] text-foreground/82">
                  {company.culture}
                </p>
              </Section>
            )}
          </article>
          {blocks.length > 0 && <BlocksRenderer blocks={blocks} />}
        </div>
        <aside className="lg:sticky lg:top-[80px] flex flex-col gap-3">
          {company.perks && company.perks.length > 0 && (
            <div className="bg-white border border-[var(--border)] rounded-2xl p-5">
              <p className="ed-label-sm mb-3">Avantages</p>
              <ul className="flex flex-col gap-2">
                {company.perks.map((p) => (
                  <li
                    key={p}
                    className="flex items-start gap-2 text-[13px] text-foreground/85"
                  >
                    <span className="mt-[3px] size-[18px] rounded-md bg-[var(--accent)]/10 text-[var(--accent)] flex items-center justify-center shrink-0">
                      <Check width={11} height={11} strokeWidth={2.4} />
                    </span>
                    {p}
                  </li>
                ))}
              </ul>
            </div>
          )}
          <div className="bg-white border border-[var(--border)] rounded-2xl p-5">
            <p className="ed-label-sm mb-3">En bref</p>
            <dl className="flex flex-col gap-2 text-[13px]">
              <Row label="Secteur" value={company.sector} />
              <Row label="Lieu" value={company.location} />
              <Row label="Effectif" value={company.size} />
              {company.founded && (
                <Row label="Fondée" value={String(company.founded)} />
              )}
              <Row
                label="Postes ouverts"
                value={
                  <span className="font-mono tabular-nums">
                    {openings.length}
                  </span>
                }
              />
            </dl>
          </div>
        </aside>
      </div>

      <article className="bg-white border border-[var(--border)] rounded-2xl px-5 sm:px-7 lg:px-9 py-6 lg:py-9">
        <div className="flex items-baseline gap-3 mb-5">
          <h2 className="font-display text-[24px] tracking-[-0.015em] text-foreground">
            Rejoindre l&apos;équipe
          </h2>
          <span className="wall-badge" data-tone="muted">
            <span className="font-mono tabular-nums">{openings.length}</span>
          </span>
        </div>
        {openings.length === 0 ? (
          <p className="text-[13.5px] text-muted-foreground italic font-display">
            Aucune offre ouverte en ce moment.
          </p>
        ) : (
          <div className="wall-grid" data-density="standard">
            {openings.map((j, i) => (
              <JobCard key={j.id} job={j} index={i} />
            ))}
          </div>
        )}
      </article>
    </div>
  );
}

/* ─── Simple mode ────────────────────────────────────────── */

function SimpleCompany({
  company,
  openings,
  blocks,
}: {
  company: Company;
  openings: Job[];
  blocks: CompanyBlock[];
}) {
  return (
    <div className="flex flex-col gap-3">
      <header
        className="relative bg-white border border-[var(--border)] rounded-2xl px-5 sm:px-7 lg:px-9 py-6 lg:py-8 overflow-hidden"
        style={{
          background: `linear-gradient(180deg, ${company.logoColor}0F 0%, #ffffff 70%)`,
        }}
      >
        <span
          className="absolute top-0 left-[20px] sm:left-[28px] lg:left-[36px] right-[20px] sm:right-[28px] lg:right-[36px] h-[3px] rounded-b-[4px]"
          style={{ background: company.logoColor }}
        />
        <div className="flex items-start gap-3 sm:gap-5">
          <CompanyLogo
            name={company.name}
            domain={company.domain}
            color={company.logoColor}
            initials={company.initials}
            size={64}
            radius={18}
          />
          <div className="min-w-0 flex-1 pt-1">
            <p className="ed-label-sm">{company.sector}</p>
            <h1 className="font-display text-[24px] sm:text-[28px] lg:text-[32px] leading-[1.08] tracking-[-0.015em] text-foreground mt-1.5">
              {company.name}
            </h1>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mt-4 text-[12.5px] text-foreground/65">
              <Stat icon={<MapPin width={12} height={12} strokeWidth={2} />}>
                {company.location}
              </Stat>
              {company.size && (
                <Stat icon={<Group width={12} height={12} strokeWidth={2} />}>
                  {company.size} collaborateurs
                </Stat>
              )}
              {company.founded && (
                <Stat
                  icon={<Calendar width={12} height={12} strokeWidth={2} />}
                >
                  Fondée en {company.founded}
                </Stat>
              )}
              {company.website && (
                <a
                  href={`https://${company.website}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-[var(--accent)] hover:underline underline-offset-2"
                >
                  <Globe width={12} height={12} strokeWidth={2} />
                  {company.website}
                </a>
              )}
            </div>
          </div>
          <span
            className="wall-badge hidden md:inline-flex"
            data-tone={openings.length > 0 ? "accent" : "muted"}
          >
            <Sparks /> {openings.length} poste{openings.length > 1 ? "s" : ""} ouvert
            {openings.length > 1 ? "s" : ""}
          </span>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 items-start">
        <article className="lg:col-span-2 bg-white border border-[var(--border)] rounded-2xl px-5 sm:px-7 lg:px-9 py-6 lg:py-9">
          <Section title="À propos">
            <p className="text-[14.5px] leading-[1.7] text-foreground/85">
              {company.description}
            </p>
          </Section>
          {company.positioning && (
            <Section title="Positionnement marché">
              <p className="text-[14px] leading-[1.7] text-foreground/80">
                {company.positioning}
              </p>
            </Section>
          )}
          {company.culture && (
            <Section title="Culture & environnement">
              <p className="text-[14px] leading-[1.7] text-foreground/80">
                {company.culture}
              </p>
            </Section>
          )}
          {blocks.length > 0 && (
            <div className="mt-6">
              <BlocksRendererInline blocks={blocks} />
            </div>
          )}
        </article>
        <aside className="lg:sticky lg:top-[80px] flex flex-col gap-3">
          {company.perks && company.perks.length > 0 && (
            <div className="bg-white border border-[var(--border)] rounded-2xl p-5">
              <p className="ed-label-sm mb-3">Avantages</p>
              <ul className="flex flex-col gap-2">
                {company.perks.map((p) => (
                  <li
                    key={p}
                    className="flex items-start gap-2 text-[13px] text-foreground/85"
                  >
                    <span className="mt-[3px] size-[18px] rounded-md bg-[var(--accent)]/10 text-[var(--accent)] flex items-center justify-center shrink-0">
                      <Check width={11} height={11} strokeWidth={2.4} />
                    </span>
                    {p}
                  </li>
                ))}
              </ul>
            </div>
          )}
          <div className="bg-white border border-[var(--border)] rounded-2xl p-5">
            <p className="ed-label-sm mb-3">En bref</p>
            <dl className="flex flex-col gap-2 text-[13px]">
              <Row label="Secteur" value={company.sector} />
              <Row label="Lieu" value={company.location} />
              <Row label="Effectif" value={company.size} />
              {company.founded && (
                <Row label="Fondée" value={String(company.founded)} />
              )}
              <Row
                label="Postes ouverts"
                value={
                  <span className="font-mono tabular-nums">
                    {openings.length}
                  </span>
                }
              />
            </dl>
          </div>
        </aside>
      </div>

      <article className="bg-white border border-[var(--border)] rounded-2xl px-5 sm:px-7 lg:px-9 py-6 lg:py-9">
        <div className="flex items-baseline gap-3 mb-5">
          <h2 className="font-display text-[22px] tracking-[-0.01em] text-foreground">
            Postes ouverts
          </h2>
          <span className="wall-badge" data-tone="muted">
            <span className="font-mono tabular-nums">{openings.length}</span>
          </span>
        </div>
        {openings.length === 0 ? (
          <p className="text-[13.5px] text-muted-foreground italic font-display">
            Aucune offre ouverte en ce moment.
          </p>
        ) : (
          <div className="wall-grid" data-density="standard">
            {openings.map((j, i) => (
              <JobCard key={j.id} job={j} index={i} />
            ))}
          </div>
        )}
      </article>
    </div>
  );
}

/* ─── Shared helpers ─────────────────────────────────────── */

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mt-8 first:mt-0">
      <h3 className="ed-label-sm mb-3">{title}</h3>
      {children}
    </section>
  );
}

function Stat({
  icon,
  children,
}: {
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <span className="inline-flex items-center gap-1.5">
      {icon}
      {children}
    </span>
  );
}

function Row({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <dt className="text-foreground/55">{label}</dt>
      <dd className="text-foreground text-right truncate">{value}</dd>
    </div>
  );
}

/* ─── Block renderer for public view ─────────────────────── */

/** Rich : chaque bloc dans sa propre card (used in RichCompany). */
function BlocksRenderer({ blocks }: { blocks: CompanyBlock[] }) {
  return (
    <>
      {blocks.map((block) => (
        <article
          key={block.id}
          className="bg-white border border-[var(--border)] rounded-2xl px-5 sm:px-7 lg:px-9 py-6 lg:py-8"
        >
          {block.title && (
            <p className="ed-label-sm mb-3">{block.title}</p>
          )}
          <PublicBlock block={block} />
        </article>
      ))}
    </>
  );
}

/** Simple : blocs inline (used in SimpleCompany, inside existing article). */
function BlocksRendererInline({ blocks }: { blocks: CompanyBlock[] }) {
  return (
    <>
      {blocks.map((block) => (
        <section key={block.id} className="mt-8">
          {block.title && (
            <h3 className="ed-label-sm mb-3">{block.title}</h3>
          )}
          <PublicBlock block={block} />
        </section>
      ))}
    </>
  );
}

function PublicBlock({ block }: { block: CompanyBlock }) {
  switch (block.type) {
    case "text":
      return (
        <p className="text-[14.5px] leading-[1.75] text-foreground/85 whitespace-pre-line">
          {block.content}
        </p>
      );

    case "image": {
      const img = block.images?.[0];
      if (!img) return null;
      return (
        <div className="rounded-xl overflow-hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={img}
            alt={block.title ?? ""}
            className="w-full h-auto max-h-[500px] object-cover"
          />
        </div>
      );
    }

    case "gallery": {
      const images = block.images ?? [];
      if (images.length === 0) return null;
      return (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5">
          {images.map((img, i) => (
            <div
              key={i}
              className="relative aspect-[4/3] overflow-hidden rounded-xl bg-[var(--background-alt)]"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={img}
                alt={`${block.title ?? "Galerie"} ${i + 1}`}
                className="w-full h-full object-cover hover:scale-[1.04] transition-transform duration-500 ease-out"
              />
            </div>
          ))}
        </div>
      );
    }

    case "quote":
      return (
        <blockquote className="border-l-[3px] border-[var(--accent)] pl-6">
          <p className="font-display italic text-[18px] sm:text-[20px] leading-[1.4] text-foreground tracking-[-0.005em]">
            « {block.content} »
          </p>
          {block.author && (
            <footer className="mt-3 text-[12.5px] text-muted-foreground">
              — {block.author}
            </footer>
          )}
        </blockquote>
      );

    case "stats": {
      const stats = block.stats ?? [];
      if (stats.length === 0) return null;
      return (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {stats.map((s, i) => (
            <div
              key={i}
              className="rounded-xl bg-[var(--background-alt)] border border-[var(--border)] p-4 text-center"
            >
              <div className="font-display text-[26px] sm:text-[30px] tracking-[-0.01em] text-foreground">
                {s.value}
              </div>
              <div className="text-[11.5px] text-muted-foreground mt-1">
                {s.label}
              </div>
            </div>
          ))}
        </div>
      );
    }

    case "perks": {
      const items = block.items ?? [];
      if (items.length === 0) return null;
      return (
        <ul className="flex flex-wrap gap-1.5">
          {items.map((p, i) => (
            <li key={i}>
              <span className="inline-flex items-center gap-1.5 h-8 px-3 rounded-full bg-white border border-[var(--border)] text-[12.5px] text-foreground">
                <Check width={11} height={11} strokeWidth={2.4} className="text-[var(--accent)]" />
                {p}
              </span>
            </li>
          ))}
        </ul>
      );
    }

    case "video": {
      const url = block.content;
      if (!url) return null;
      const embedUrl = getEmbedUrl(url);
      if (!embedUrl) {
        return (
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[13px] text-[var(--accent)] hover:underline underline-offset-2"
          >
            Voir la video
          </a>
        );
      }
      return (
        <div className="relative w-full aspect-video rounded-xl overflow-hidden bg-black">
          <iframe
            src={embedUrl}
            title={block.title ?? "Video"}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            className="absolute inset-0 w-full h-full"
          />
        </div>
      );
    }

    default:
      return null;
  }
}

/** Convert YouTube/Vimeo URLs to embeddable iframe URLs. */
function getEmbedUrl(url: string): string | null {
  // YouTube: youtube.com/watch?v=ID or youtu.be/ID
  const ytMatch = url.match(
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
  );
  if (ytMatch) return `https://www.youtube.com/embed/${ytMatch[1]}`;
  // Vimeo: vimeo.com/ID
  const vimeoMatch = url.match(/vimeo\.com\/(\d+)/);
  if (vimeoMatch) return `https://player.vimeo.com/video/${vimeoMatch[1]}`;
  return null;
}
