import Link from "next/link";
import { ArrowUpRight, MapPin, Sparks } from "iconoir-react";
import {
  type Job,
  companyBarColor,
  formatSalary,
  relativeDate,
} from "@/lib/data";
import { CompanyLogo } from "./company-logo";
import { MatchPill } from "./match-pill";

type Props = {
  jobs: Job[];
};

/**
 * Section "Mises en avant" au-dessus de la grille du mur.
 * Layout bento : 1 card hero large (2/3) + 2 cards empilées (1/3).
 * Si une seule featured : pleine largeur. Si 2 : 50/50. Si 3+ : bento.
 */
export function FeaturedJobs({ jobs }: Props) {
  if (jobs.length === 0) return null;

  const [hero, ...rest] = jobs;
  const side = rest.slice(0, 2);

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

      {side.length === 0 ? (
        /* 1 seule featured : pleine largeur */
        <HeroCard job={hero} />
      ) : (
        /* Bento : hero 3/5 + side 2/5 */
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
      )}
    </section>
  );
}

/* ─── Hero card : grande, immersive ──────────────────────── */

function HeroCard({ job }: { job: Job }) {
  const bar = companyBarColor(job.company.id);
  const salary = formatSalary(job);

  return (
    <Link
      href={`/jobs/${job.slug}`}
      className="group relative block bg-white border border-[var(--border)] rounded-2xl overflow-hidden h-full hover:border-foreground/20 hover:shadow-[0_4px_24px_rgba(10,10,10,0.06)] transition-all"
    >
      {/* Barre de couleur */}
      <span
        className="absolute top-0 left-6 right-6 h-[3px] rounded-b-[4px] transition-all group-hover:left-4 group-hover:right-4"
        style={{ background: bar }}
      />

      <div className="p-5 sm:p-7 lg:p-8 flex flex-col h-full">
        {/* Top : logo + badges */}
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

        {/* Badges */}
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
            <span className="wall-badge" data-tone="danger">
              Urgent
            </span>
          )}
          <MatchPill job={job} />
        </div>

        {/* Titre */}
        <h3 className="font-display text-[24px] sm:text-[28px] lg:text-[32px] leading-[1.08] tracking-[-0.015em] text-foreground mt-4 group-hover:text-[var(--accent)] transition-colors">
          {job.title}
        </h3>

        <p className="text-[14px] sm:text-[15px] font-medium text-foreground/70 mt-2">
          {job.company.name}
        </p>

        {/* Description */}
        <p className="text-[13.5px] sm:text-[14px] text-muted-foreground leading-[1.6] mt-3 line-clamp-3 max-w-2xl">
          {job.shortDescription}
        </p>

        <div className="flex-1 min-h-4" />

        {/* Footer */}
        <div className="flex items-center justify-between gap-3 mt-5 pt-4 border-t border-[var(--border)] flex-wrap">
          <div className="flex items-center gap-2 min-w-0">
            <span className="wall-badge" data-tone="muted">
              <MapPin /> {shortLoc(job.location)}
            </span>
            <span className="wall-badge" data-tone="muted">
              {job.lang.toUpperCase()}
            </span>
            {salary && (
              <span className="wall-badge hidden sm:inline-flex" data-tone="muted">
                {salary}
              </span>
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

/* ─── Side card : compacte, empilée ──────────────────────── */

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

function shortLoc(loc: string): string {
  if (loc.includes("—")) return loc.split("—")[1].trim();
  return loc;
}
