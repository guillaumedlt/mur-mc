"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowUpRight,
  Calendar,
  Check,
  Globe,
  Group,
  MapPin,
  PlaySolid,
  Sparks,
  Xmark,
} from "iconoir-react";
import type { Company, Job } from "@/lib/data";
import { CompanyLogo } from "./company-logo";
import { JobCard } from "./job-card";

type CompanyBlock = NonNullable<Company["blocks"]>[number];

type Props = {
  company: Company;
  openings: Job[];
};

export function CompanyPublicView({ company, openings }: Props) {
  const blocks = company.blocks ?? [];
  const hasCover = company.hasCover || !!company.coverUrl;
  const hasVideo = blocks.some((b) => b.type === "video" && b.content);

  return (
    <div className="flex flex-col gap-3">
      {/* ── Hero ── */}
      {hasCover ? (
        <CoverHero company={company} openings={openings} />
      ) : hasVideo ? (
        <VideoHero company={company} openings={openings} block={blocks.find((b) => b.type === "video")!} />
      ) : (
        <GradientHero company={company} openings={openings} />
      )}

      {/* ── Tagline callout ── */}
      {company.tagline && (
        <div className="bg-white border border-[var(--border)] rounded-2xl px-5 sm:px-7 lg:px-9 py-5 sm:py-6">
          <p className="font-display italic text-[18px] sm:text-[22px] lg:text-[24px] leading-[1.35] tracking-[-0.01em] text-foreground/90 text-center max-w-3xl mx-auto">
            {company.tagline}
          </p>
        </div>
      )}

      {/* ── Body grid ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 items-start">
        {/* Main content */}
        <div className="lg:col-span-2 flex flex-col gap-3">
          <TextSection label="L'entreprise" text={company.description} />
          <TextSection label="Positionnement" text={company.positioning} />
          <TextSection label="Culture & environnement" text={company.culture} />

          {/* Blocks (gallery, videos, quotes, stats) */}
          {blocks.length > 0 && <BlocksRenderer blocks={blocks} />}
        </div>

        {/* Sidebar */}
        <aside className="lg:sticky lg:top-[80px] flex flex-col gap-3">
          {/* CTA candidature spontanee */}
          {openings.length > 0 && (
            <div className="bg-[var(--accent)] rounded-2xl p-5 text-background">
              <p className="text-[13px] font-semibold opacity-90">
                {openings.length} poste{openings.length > 1 ? "s" : ""} ouvert{openings.length > 1 ? "s" : ""}
              </p>
              <p className="text-[12px] opacity-70 mt-1 leading-snug">
                Decouvrez les opportunites chez {company.name}
              </p>
              <a
                href="#openings"
                className="mt-3 h-9 px-4 rounded-full bg-background text-foreground text-[12.5px] font-medium inline-flex items-center gap-1.5 hover:bg-background/90 transition-colors"
              >
                Voir les offres
                <ArrowUpRight width={11} height={11} strokeWidth={2.2} />
              </a>
            </div>
          )}

          {/* Avantages */}
          {company.perks && company.perks.length > 0 && (
            <div className="bg-white border border-[var(--border)] rounded-2xl p-5">
              <p className="ed-label-sm mb-3">Avantages</p>
              <ul className="flex flex-col gap-2">
                {company.perks.map((p) => (
                  <li key={p} className="flex items-start gap-2 text-[13px] text-foreground/85">
                    <span className="mt-[3px] size-[18px] rounded-md bg-[var(--accent)]/10 text-[var(--accent)] flex items-center justify-center shrink-0">
                      <Check width={11} height={11} strokeWidth={2.4} />
                    </span>
                    {p}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* En bref */}
          <div className="bg-white border border-[var(--border)] rounded-2xl p-5">
            <p className="ed-label-sm mb-3">En bref</p>
            <dl className="flex flex-col gap-2.5 text-[13px]">
              <Row label="Secteur" value={company.sector} />
              <Row label="Lieu" value={company.location} />
              {company.size && <Row label="Effectif" value={company.size} />}
              {company.founded && <Row label="Fondee" value={String(company.founded)} />}
              <Row
                label="Postes ouverts"
                value={<span className="font-mono tabular-nums text-[var(--accent)] font-semibold">{openings.length}</span>}
              />
            </dl>
          </div>

          {/* Website CTA */}
          {company.website && (
            <a
              href={`https://${company.website}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 h-11 rounded-2xl border border-[var(--border)] bg-white text-[13px] text-foreground/80 hover:text-foreground hover:border-foreground/30 transition-colors"
            >
              <Globe width={13} height={13} strokeWidth={2} />
              Visiter {company.website}
              <ArrowUpRight width={11} height={11} strokeWidth={2.2} className="text-foreground/40" />
            </a>
          )}
        </aside>
      </div>

      {/* ── Offres ouvertes ── */}
      <article
        id="openings"
        className="bg-white border border-[var(--border)] rounded-2xl px-5 sm:px-7 lg:px-9 py-6 lg:py-9 scroll-mt-20"
      >
        <div className="flex items-baseline justify-between gap-3 mb-5 flex-wrap">
          <div className="flex items-baseline gap-3">
            <h2 className="font-display text-[24px] tracking-[-0.015em] text-foreground">
              Rejoindre l&apos;equipe
            </h2>
            <span className="wall-badge" data-tone="muted">
              <span className="font-mono tabular-nums">{openings.length}</span>
            </span>
          </div>
          {openings.length > 3 && (
            <Link
              href={`/?company=${company.slug}`}
              className="text-[12.5px] text-[var(--accent)] hover:underline underline-offset-2"
            >
              Tout voir sur le mur
            </Link>
          )}
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

/* ─── Hero variants ─────────────────────────────────────── */

function CoverHero({ company, openings }: { company: Company; openings: Job[] }) {
  const cover = company.coverUrl ?? `https://picsum.photos/seed/${company.slug}-cover/1600/520`;
  const isDataUrl = cover.startsWith("data:");

  return (
    <header className="bg-white border border-[var(--border)] rounded-2xl overflow-hidden">
      <div className="relative h-[200px] sm:h-[280px] lg:h-[340px] w-full">
        {isDataUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={cover} alt={`${company.name} — couverture`} className="absolute inset-0 w-full h-full object-cover" />
        ) : (
          <Image src={cover} alt={`${company.name} — couverture`} fill priority sizes="(max-width: 1280px) 100vw, 1100px" className="object-cover" />
        )}
        <div className="absolute inset-0 bg-gradient-to-b from-black/0 via-black/10 to-black/50" />
      </div>
      <IdentityBar company={company} openings={openings} overlap />
    </header>
  );
}

function VideoHero({ company, openings, block }: { company: Company; openings: Job[]; block: CompanyBlock }) {
  const embedUrl = getEmbedUrl(block.content ?? "");
  if (!embedUrl) return <GradientHero company={company} openings={openings} />;

  return (
    <header className="bg-white border border-[var(--border)] rounded-2xl overflow-hidden">
      <div className="relative w-full aspect-video bg-black rounded-t-2xl overflow-hidden">
        <iframe
          src={embedUrl}
          title={block.title ?? `Video ${company.name}`}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          className="absolute inset-0 w-full h-full"
        />
      </div>
      <IdentityBar company={company} openings={openings} />
    </header>
  );
}

function GradientHero({ company, openings }: { company: Company; openings: Job[] }) {
  return (
    <header
      className="relative bg-white border border-[var(--border)] rounded-2xl overflow-hidden"
      style={{ background: `linear-gradient(180deg, ${company.logoColor}0F 0%, #ffffff 70%)` }}
    >
      <span
        className="absolute top-0 left-[20px] sm:left-[28px] lg:left-[36px] right-[20px] sm:right-[28px] lg:right-[36px] h-[3px] rounded-b-[4px]"
        style={{ background: company.logoColor }}
      />
      <IdentityBar company={company} openings={openings} />
    </header>
  );
}

/* ─── Identity bar (shared across heroes) ───────────────── */

function IdentityBar({ company, openings, overlap }: { company: Company; openings: Job[]; overlap?: boolean }) {
  return (
    <div className={`px-5 sm:px-7 lg:px-9 py-5 sm:py-6 ${overlap ? "-mt-12 sm:-mt-14 relative" : ""}`}>
      <div className="flex items-end gap-4 sm:gap-5">
        <div className={`shrink-0 ${overlap ? "rounded-[20px] sm:rounded-[24px] p-1.5 bg-white shadow-[0_8px_30px_-6px_rgba(10,10,10,0.3)]" : ""}`}>
          <CompanyLogo
            name={company.name}
            domain={company.domain}
            logoUrl={company.logoUrl}
            color={company.logoColor}
            initials={company.initials}
            size={overlap ? 88 : 64}
            radius={18}
          />
        </div>
        <div className="min-w-0 flex-1 pb-1">
          <h1 className="font-display text-[26px] sm:text-[32px] lg:text-[38px] leading-[1.05] tracking-[-0.02em] text-foreground">
            {company.name}
          </h1>
          <p className="text-[13px] sm:text-[14px] text-muted-foreground mt-1">{company.sector}</p>
        </div>
        <div className="hidden md:flex shrink-0 pb-1">
          <span className="wall-badge" data-tone={openings.length > 0 ? "accent" : "muted"}>
            <Sparks /> {openings.length} poste{openings.length > 1 ? "s" : ""} ouvert{openings.length > 1 ? "s" : ""}
          </span>
        </div>
      </div>

      {/* Meta stats row */}
      <div className="flex flex-wrap items-center gap-x-5 gap-y-2 mt-5 text-[13px] text-foreground/60">
        <MetaStat icon={<MapPin width={13} height={13} strokeWidth={2} />}>{company.location}</MetaStat>
        {company.size && <MetaStat icon={<Group width={13} height={13} strokeWidth={2} />}>{company.size} collaborateurs</MetaStat>}
        {company.founded && <MetaStat icon={<Calendar width={13} height={13} strokeWidth={2} />}>Fondee en {company.founded}</MetaStat>}
        {company.website && (
          <a href={`https://${company.website}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-[var(--accent)] hover:underline underline-offset-2">
            <Globe width={13} height={13} strokeWidth={2} /> {company.website}
          </a>
        )}
      </div>
    </div>
  );
}

/* ─── Text sections ─────────────────────────────────────── */

function TextSection({ label, text }: { label: string; text?: string | null }) {
  if (!text) return null;
  return (
    <article className="bg-white border border-[var(--border)] rounded-2xl px-5 sm:px-7 lg:px-9 py-6 lg:py-8">
      <h3 className="ed-label-sm mb-4">{label}</h3>
      <p className="text-[15px] leading-[1.85] text-foreground/85 whitespace-pre-line">
        {text}
      </p>
    </article>
  );
}

/* ─── Shared primitives ─────────────────────────────────── */

function MetaStat({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) {
  return <span className="inline-flex items-center gap-1.5">{icon}{children}</span>;
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <dt className="text-foreground/55">{label}</dt>
      <dd className="text-foreground text-right truncate">{value}</dd>
    </div>
  );
}

/* ─── Blocks renderer ───────────────────────────────────── */

function BlocksRenderer({ blocks }: { blocks: CompanyBlock[] }) {
  return (
    <>
      {blocks.map((block) => (
        <article key={block.id} className="bg-white border border-[var(--border)] rounded-2xl px-5 sm:px-7 lg:px-9 py-6 lg:py-8">
          {block.title && <p className="ed-label-sm mb-3">{block.title}</p>}
          <PublicBlock block={block} />
        </article>
      ))}
    </>
  );
}

function PublicBlock({ block }: { block: CompanyBlock }) {
  switch (block.type) {
    case "text":
      return <p className="text-[14.5px] leading-[1.75] text-foreground/85 whitespace-pre-line">{block.content}</p>;

    case "image": {
      const img = block.images?.[0];
      if (!img) return null;
      return (
        <div className="rounded-xl overflow-hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={img} alt={block.title ?? ""} className="w-full h-auto max-h-[500px] object-cover" />
        </div>
      );
    }

    case "gallery":
      return <GalleryBlock block={block} />;

    case "quote":
      return (
        <blockquote className="border-l-[3px] border-[var(--accent)] pl-6">
          <p className="font-display italic text-[18px] sm:text-[20px] leading-[1.4] text-foreground tracking-[-0.005em]">
            « {block.content} »
          </p>
          {block.author && <footer className="mt-3 text-[12.5px] text-muted-foreground">— {block.author}</footer>}
        </blockquote>
      );

    case "stats": {
      const stats = block.stats ?? [];
      if (stats.length === 0) return null;
      return (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {stats.map((s, i) => (
            <div key={i} className="rounded-xl bg-[var(--background-alt)] border border-[var(--border)] p-4 text-center">
              <div className="font-display text-[26px] sm:text-[30px] tracking-[-0.01em] text-foreground">{s.value}</div>
              <div className="text-[11.5px] text-muted-foreground mt-1">{s.label}</div>
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
                <Check width={11} height={11} strokeWidth={2.4} className="text-[var(--accent)]" /> {p}
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
          <a href={url} target="_blank" rel="noopener noreferrer" className="text-[13px] text-[var(--accent)] hover:underline underline-offset-2">
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

/* ─── Gallery with lightbox ─────────────────────────────── */

function GalleryBlock({ block }: { block: CompanyBlock }) {
  const images = block.images ?? [];
  const [lightboxIdx, setLightboxIdx] = useState<number | null>(null);

  if (images.length === 0) return null;

  return (
    <>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5">
        {images.map((img, i) => (
          <button
            key={i}
            type="button"
            onClick={() => setLightboxIdx(i)}
            className="relative aspect-[4/3] overflow-hidden rounded-xl bg-[var(--background-alt)] group cursor-pointer"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={img}
              alt={`${block.title ?? "Galerie"} ${i + 1}`}
              className="w-full h-full object-cover group-hover:scale-[1.04] transition-transform duration-500 ease-out"
            />
            <span className="absolute inset-0 bg-foreground/0 group-hover:bg-foreground/10 transition-colors" />
          </button>
        ))}
      </div>

      {/* Lightbox fullscreen */}
      {lightboxIdx !== null && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center"
          onClick={() => setLightboxIdx(null)}
        >
          <button
            type="button"
            className="absolute top-4 right-4 size-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors z-10"
            onClick={() => setLightboxIdx(null)}
            aria-label="Fermer"
          >
            <Xmark width={18} height={18} strokeWidth={2} />
          </button>

          {images.length > 1 && (
            <>
              <button
                type="button"
                className="absolute left-4 top-1/2 -translate-y-1/2 size-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors z-10"
                onClick={(e) => { e.stopPropagation(); setLightboxIdx((lightboxIdx - 1 + images.length) % images.length); }}
                aria-label="Precedente"
              >
                <span className="text-[18px]">&larr;</span>
              </button>
              <button
                type="button"
                className="absolute right-4 top-1/2 -translate-y-1/2 size-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors z-10"
                onClick={(e) => { e.stopPropagation(); setLightboxIdx((lightboxIdx + 1) % images.length); }}
                aria-label="Suivante"
              >
                <span className="text-[18px]">&rarr;</span>
              </button>
            </>
          )}

          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={images[lightboxIdx]}
            alt={`${block.title ?? "Photo"} ${lightboxIdx + 1}`}
            className="max-w-[90vw] max-h-[85vh] object-contain rounded-xl"
            onClick={(e) => e.stopPropagation()}
          />

          <span className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white/60 text-[12px] font-mono">
            {lightboxIdx + 1} / {images.length}
          </span>
        </div>
      )}
    </>
  );
}

/* ─── Utils ─────────────────────────────────────────────── */

function getEmbedUrl(url: string): string | null {
  const ytMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/);
  if (ytMatch) return `https://www.youtube.com/embed/${ytMatch[1]}`;
  const vimeoMatch = url.match(/vimeo\.com\/(\d+)/);
  if (vimeoMatch) return `https://player.vimeo.com/video/${vimeoMatch[1]}`;
  return null;
}
