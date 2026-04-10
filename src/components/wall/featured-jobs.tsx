import Link from "next/link";
import { ArrowUpRight, MapPin, Sparks } from "iconoir-react";
import {
  type Job,
  companyBarColor,
  formatSalary,
  relativeDate,
} from "@/lib/data";
import type { Density } from "./types";
import { CompanyLogo } from "./company-logo";
import { MatchPill } from "./match-pill";

type Props = {
  jobs: Job[];
  density: Density;
};

/**
 * Section "Mises en avant" — s'adapte a la densite :
 * - list : ligne compacte horizontale par featured
 * - comfortable/standard : bento hero 3/5 + side 2/5
 * - dense : grille 4 cols de cards compactes
 */
export function FeaturedJobs({ jobs, density }: Props) {
  if (jobs.length === 0) return null;

  return (
    <section className="mb-3">
      <div className="flex items-center gap-2.5 mb-3">
        <Sparks
          width={13}
          height={13}
          strokeWidth={2.2}
          className="text-[var(--accent)]"
        />
        <span className="ed-label-sm text-[var(--accent)]">
          Mises en avant
        </span>
      </div>

      {density === "list" ? (
        <ListLayout jobs={jobs} />
      ) : density === "dense" ? (
        <DenseLayout jobs={jobs} />
      ) : (
        <BentoLayout jobs={jobs} />
      )}
    </section>
  );
}

/* ─── Bento : hero + side (comfortable/standard) ─────────── */

function BentoLayout({ jobs }: { jobs: Job[] }) {
  const [hero, ...rest] = jobs;
  const side = rest.slice(0, 2);

  return side.length === 0 ? (
    <HeroCard job={hero} />
  ) : (
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-3">
      <div className="lg:col-span-3">
        <HeroCard job={hero} />
      </div>
      <div className="lg:col-span-2 flex flex-col gap-3">
        {side.map((j) => (
          <SideCard key={j.id} job={j} />
        ))}
      </div>
    </div>
  );
}

/* ─── Dense : grille compacte ────────────────────────────── */

function DenseLayout({ jobs }: { jobs: Job[] }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
      {jobs.map((j) => (
        <CompactCard key={j.id} job={j} />
      ))}
    </div>
  );
}

/* ─── List : lignes horizontales ─────────────────────────── */

function ListLayout({ jobs }: { jobs: Job[] }) {
  return (
    <div className="flex flex-col gap-2">
      {jobs.map((j) => (
        <ListRow key={j.id} job={j} />
      ))}
    </div>
  );
}

/* ─── Hero card (bento) ──────────────────────────────────── */

function HeroCard({ job }: { job: Job }) {
  const bar = companyBarColor(job.company.id);
  const salary = formatSalary(job);

  return (
    <Link
      href={`/jobs/${job.slug}`}
      className="group relative block bg-white border border-[var(--border)] rounded-2xl overflow-hidden h-full hover:border-foreground/20 hover:shadow-[0_4px_24px_rgba(10,10,10,0.06)] transition-all"
    >
      <span
        className="absolute top-0 left-6 right-6 h-[3px] rounded-b-[4px] transition-all group-hover:left-4 group-hover:right-4"
        style={{ background: bar }}
      />
      <div className="p-5 sm:p-7 lg:p-8 flex flex-col h-full">
        <div className="flex items-start justify-between gap-4">
          <CompanyLogo
            name={job.company.name}
            domain={job.company.domain}
            color={job.company.logoColor}
            initials={job.company.initials}
            size={52}
            radius={16}
          />
          <span className="wall-card-arrow shrink-0 size-8 rounded-full border border-[var(--border)] bg-white flex items-center justify-center text-foreground/60 group-hover:text-[var(--accent)] group-hover:border-[var(--accent)]/40 transition-colors">
            <ArrowUpRight width={14} height={14} strokeWidth={2.2} />
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-1.5 mt-4">
          <span className="wall-badge" data-tone="accent">
            <Sparks /> A la une
          </span>
          <span
            className="wall-badge"
            data-tone="bar"
            style={{ "--bar-color": bar } as React.CSSProperties}
          >
            {job.type}
          </span>
          {job.urgent && (
            <span className="wall-badge" data-tone="danger">Urgent</span>
          )}
          <MatchPill job={job} />
        </div>
        <h3 className="font-display text-[24px] sm:text-[28px] lg:text-[32px] leading-[1.08] tracking-[-0.015em] text-foreground mt-4 group-hover:text-[var(--accent)] transition-colors">
          {job.title}
        </h3>
        <p className="text-[14px] sm:text-[15px] font-medium text-foreground/70 mt-2">
          {job.company.name}
        </p>
        <p className="text-[13.5px] sm:text-[14px] text-muted-foreground leading-[1.6] mt-3 line-clamp-3 max-w-2xl">
          {job.shortDescription}
        </p>
        <div className="flex-1 min-h-4" />
        <div className="flex items-center justify-between gap-3 mt-5 pt-4 border-t border-[var(--border)] flex-wrap">
          <div className="flex items-center gap-2 min-w-0">
            <span className="wall-badge" data-tone="muted">
              <MapPin /> {shortLoc(job.location)}
            </span>
            <span className="wall-badge" data-tone="muted">{job.lang.toUpperCase()}</span>
            {salary && (
              <span className="wall-badge hidden sm:inline-flex" data-tone="muted">{salary}</span>
            )}
          </div>
          <span className="text-[11px] font-mono text-[var(--tertiary-foreground)]">
            {relativeDate(job.postedAt)}
          </span>
        </div>
      </div>
    </Link>
  );
}

/* ─── Side card (bento) ──────────────────────────────────── */

function SideCard({ job }: { job: Job }) {
  const bar = companyBarColor(job.company.id);

  return (
    <Link
      href={`/jobs/${job.slug}`}
      className="group relative flex gap-4 bg-white border border-[var(--border)] rounded-2xl overflow-hidden p-4 sm:p-5 hover:border-foreground/20 hover:shadow-[0_4px_24px_rgba(10,10,10,0.06)] transition-all h-full"
    >
      <span
        className="absolute top-0 left-5 right-5 h-[2px] rounded-b-[3px]"
        style={{ background: bar }}
      />
      <CompanyLogo
        name={job.company.name}
        domain={job.company.domain}
        color={job.company.logoColor}
        initials={job.company.initials}
        size={44}
        radius={14}
      />
      <div className="flex flex-col flex-1 min-w-0">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="wall-badge" data-tone="accent">
            <Sparks /> A la une
          </span>
          <span
            className="wall-badge"
            data-tone="bar"
            style={{ "--bar-color": bar } as React.CSSProperties}
          >
            {job.type}
          </span>
          <MatchPill job={job} />
        </div>
        <h3 className="font-display text-[17px] sm:text-[19px] leading-[1.2] tracking-[-0.005em] text-foreground mt-2 line-clamp-2 group-hover:text-[var(--accent)] transition-colors">
          {job.title}
        </h3>
        <p className="text-[13px] font-medium text-foreground/70 mt-1">
          {job.company.name}
        </p>
        <p className="text-[12.5px] text-muted-foreground leading-[1.55] mt-2 line-clamp-2 hidden sm:block">
          {job.shortDescription}
        </p>
        <div className="flex-1 min-h-2" />
        <div className="flex items-center gap-2 mt-3 text-[11px]">
          <span className="wall-badge" data-tone="muted">
            <MapPin /> {shortLoc(job.location)}
          </span>
          <span className="font-mono text-[var(--tertiary-foreground)] ml-auto">
            {relativeDate(job.postedAt)}
          </span>
        </div>
      </div>
    </Link>
  );
}

/* ─── Compact card (dense mode) ──────────────────────────── */

function CompactCard({ job }: { job: Job }) {
  const bar = companyBarColor(job.company.id);

  return (
    <Link
      href={`/jobs/${job.slug}`}
      className="group relative bg-white border border-[var(--border)] rounded-2xl overflow-hidden p-4 hover:border-foreground/20 hover:shadow-[0_4px_24px_rgba(10,10,10,0.06)] transition-all flex flex-col"
    >
      <span
        className="absolute top-0 left-4 right-4 h-[2px] rounded-b-[3px]"
        style={{ background: bar }}
      />
      <div className="flex items-start gap-2.5">
        <CompanyLogo
          name={job.company.name}
          domain={job.company.domain}
          color={job.company.logoColor}
          initials={job.company.initials}
          size={36}
          radius={10}
        />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <span className="wall-badge" data-tone="accent">
              <Sparks />
            </span>
            <span
              className="wall-badge"
              data-tone="bar"
              style={{ "--bar-color": bar } as React.CSSProperties}
            >
              {job.type}
            </span>
          </div>
          <h3 className="font-display text-[15px] leading-tight tracking-[-0.005em] text-foreground mt-1.5 line-clamp-2 group-hover:text-[var(--accent)] transition-colors">
            {job.title}
          </h3>
          <p className="text-[12px] font-medium text-foreground/65 mt-0.5">
            {job.company.name}
          </p>
        </div>
      </div>
      <div className="flex-1" />
      <div className="flex items-center justify-between mt-3 text-[10.5px]">
        <span className="text-muted-foreground">{shortLoc(job.location)}</span>
        <span className="font-mono text-[var(--tertiary-foreground)]">
          {relativeDate(job.postedAt)}
        </span>
      </div>
    </Link>
  );
}

/* ─── List row (list mode) ───────────────────────────────── */

function ListRow({ job }: { job: Job }) {
  const bar = companyBarColor(job.company.id);

  return (
    <Link
      href={`/jobs/${job.slug}`}
      className="group relative flex items-center gap-3 sm:gap-4 bg-white border border-[var(--border)] rounded-xl overflow-hidden px-4 py-3 hover:border-foreground/20 hover:shadow-[0_2px_12px_rgba(10,10,10,0.06)] transition-all"
    >
      <span
        className="absolute top-0 left-4 right-4 h-[2px] rounded-b-[2px]"
        style={{ background: bar }}
      />
      <CompanyLogo
        name={job.company.name}
        domain={job.company.domain}
        color={job.company.logoColor}
        initials={job.company.initials}
        size={36}
        radius={10}
      />
      <div className="min-w-0 flex-1">
        <h3 className="text-[14px] font-display font-medium text-foreground line-clamp-1 group-hover:text-[var(--accent)] transition-colors">
          {job.title}
        </h3>
        <p className="text-[12px] text-muted-foreground mt-0.5">
          {job.company.name} · {shortLoc(job.location)}
        </p>
      </div>
      <div className="flex items-center gap-1.5 shrink-0">
        <span className="wall-badge" data-tone="accent">
          <Sparks />
        </span>
        <span
          className="wall-badge hidden sm:inline-flex"
          data-tone="bar"
          style={{ "--bar-color": bar } as React.CSSProperties}
        >
          {job.type}
        </span>
        <MatchPill job={job} />
      </div>
      <span className="text-[10.5px] font-mono text-[var(--tertiary-foreground)] shrink-0 hidden md:block">
        {relativeDate(job.postedAt)}
      </span>
      <ArrowUpRight
        width={12}
        height={12}
        strokeWidth={2.2}
        className="text-foreground/40 group-hover:text-[var(--accent)] shrink-0 transition-colors"
      />
    </Link>
  );
}

function shortLoc(loc: string): string {
  if (loc.includes("—")) return loc.split("—")[1].trim();
  return loc;
}
