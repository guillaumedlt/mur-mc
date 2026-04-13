import Link from "next/link";
import { ArrowUpRight, MapPin, Sparks } from "iconoir-react";
import {
  type Job,
  companyBarColor,
  daysSincePosted,
  relativeDate,
} from "@/lib/data";
import { CompanyLogo } from "./company-logo";
import { MatchPill } from "./match-pill";

type Props = {
  job: Job;
  index: number;
  editorial?: boolean;
};

export function JobCard({ job, index, editorial = false }: Props) {
  const bar = companyBarColor(job.company.id);
  const days = daysSincePosted(job.postedAt);
  const fresh = days <= 1;

  return (
    <Link
      href={`/jobs/${job.slug}`}
      className={`wall-card group ${editorial ? "is-editorial" : ""}`}
      style={
        {
          "--bar-color": bar,
          "--i": index,
          "--vt-name": `card-${job.id}`,
        } as React.CSSProperties
      }
    >
      <span className="wall-card-bar" />

      {/* Header : logo + arrow */}
      <div className="flex items-start justify-between gap-3">
        <CompanyLogo
          name={job.company.name}
          domain={job.company.domain}
          logoUrl={job.company.logoUrl}
          color={job.company.logoColor}
          initials={job.company.initials}
          size={44}
          radius={14}
        />
        <span className="wall-card-arrow shrink-0 mt-0.5 size-7 rounded-full border border-[var(--border)] bg-white flex items-center justify-center text-foreground/60 group-hover:text-[var(--accent)] group-hover:border-[var(--accent)]/40" data-list-hide>
          <ArrowUpRight width={13} height={13} strokeWidth={2.2} />
        </span>
      </div>

      {/* Badges */}
      <div className="flex flex-wrap items-center gap-1.5 mt-3" data-list-hide>
        <span className="wall-badge" data-tone="bar">
          {job.type}
        </span>
        <MatchPill job={job} />
        {editorial && (
          <span className="wall-badge" data-tone="accent">
            <Sparks /> À la une
          </span>
        )}
        {fresh && !editorial && (
          <span className="wall-badge" data-tone="fresh">
            Nouveau
          </span>
        )}
      </div>

      {/* Title + company — toujours visible */}
      <div className="wall-card-info">
        <h3 className="wall-card-title font-display text-[21px] leading-[1.18] mt-2.5 text-foreground line-clamp-2 tracking-[-0.005em]">
          {job.title}
        </h3>

        <p className="text-[13.5px] font-medium text-foreground/70 mt-1">
          {job.company.name}
        </p>
      </div>

      {/* Description — cachée en mode liste */}
      <p className="text-[13px] text-muted-foreground leading-[1.55] mt-3 line-clamp-3" data-list-hide>
        {editorial ? (
          <em className="font-display not-italic text-foreground/85">
            {job.shortDescription}
          </em>
        ) : (
          job.shortDescription
        )}
      </p>

      <div className="flex-1" data-list-hide />

      {/* Footer : metas en pills — cachée en mode liste */}
      <div className="flex items-center justify-between mt-4 pt-3 border-t border-[var(--border)] gap-2" data-list-hide>
        <div className="flex items-center gap-1.5 min-w-0">
          <span className="wall-badge" data-tone="muted">
            <MapPin /> {shortLoc(job.location)}
          </span>
          <span className="wall-badge" data-tone="muted">
            {job.lang.toUpperCase()}
          </span>
        </div>
        <span className="text-[11px] font-mono text-[var(--tertiary-foreground)] shrink-0">
          {relativeDate(job.postedAt)}
        </span>
      </div>

      {/* Liste-only meta row — visible uniquement en mode liste */}
      <div className="wall-card-list-meta hidden">
        <span className="wall-badge" data-tone="bar">{job.type}</span>
        <MatchPill job={job} />
        {fresh && (
          <span className="wall-badge" data-tone="fresh">Nouveau</span>
        )}
        <span className="wall-badge" data-tone="muted">
          <MapPin /> {shortLoc(job.location)}
        </span>
        <span className="text-[11px] font-mono text-[var(--tertiary-foreground)]">
          {relativeDate(job.postedAt)}
        </span>
        <span className="wall-card-arrow shrink-0 size-6 rounded-full border border-[var(--border)] bg-white flex items-center justify-center text-foreground/60 group-hover:text-[var(--accent)] group-hover:border-[var(--accent)]/40 ml-auto">
          <ArrowUpRight width={12} height={12} strokeWidth={2.2} />
        </span>
      </div>
    </Link>
  );
}

function shortLoc(loc: string): string {
  if (loc.includes("—")) return loc.split("—")[1].trim();
  return loc;
}
