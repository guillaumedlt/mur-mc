import Link from "next/link";
import { ArrowUpRight } from "iconoir-react";
import type { Company } from "@/lib/data";
import { CompanyLogo } from "./company-logo";

type Props = {
  company: Company;
  jobCount: number;
  index: number;
};

export function CompanyCard({ company, jobCount, index }: Props) {
  return (
    <Link
      href={`/entreprises/${company.slug}`}
      className="wall-card group"
      style={
        {
          "--bar-color": company.logoColor,
          "--i": index,
        } as React.CSSProperties
      }
    >
      <span className="wall-card-bar" />

      <div className="flex items-start justify-between gap-3">
        <CompanyLogo
          name={company.name}
          domain={company.domain}
          color={company.logoColor}
          initials={company.initials}
          size={48}
          radius={14}
        />
        <span className="wall-card-arrow shrink-0 mt-0.5 size-7 rounded-full border border-[var(--border)] bg-white flex items-center justify-center text-foreground/60 group-hover:text-[var(--accent)] group-hover:border-[var(--accent)]/40">
          <ArrowUpRight width={13} height={13} strokeWidth={2.2} />
        </span>
      </div>

      <h3 className="wall-card-title font-display text-[20px] leading-[1.2] mt-4 text-foreground line-clamp-2 tracking-[-0.005em]">
        {company.name}
      </h3>

      <p className="ed-label-sm mt-2">{company.sector}</p>

      <p className="text-[13px] text-muted-foreground leading-[1.55] mt-3 line-clamp-3">
        {company.description}
      </p>

      <div className="flex-1" />

      <div className="flex items-center justify-between mt-4 pt-3 border-t border-[var(--border)] gap-2">
        <span className="wall-badge" data-tone="muted">
          {company.location}
        </span>
        <span
          className="wall-badge"
          data-tone={jobCount > 0 ? "accent" : "muted"}
        >
          {jobCount} offre{jobCount > 1 ? "s" : ""}
        </span>
      </div>
    </Link>
  );
}
