import Link from "next/link";
import {
  ArrowUpRight,
  Bag,
  Calendar,
  Group,
  MapPin,
  Sparks,
} from "iconoir-react";
import type { Company } from "@/lib/data";
import { CompanyLogo } from "./company-logo";

type Props = {
  companies: Company[];
  counts: Record<string, number>;
};

/**
 * Section "Entreprises en vedette" au-dessus de la grille de l'annuaire.
 * Affiche les entreprises `hasCover: true` dans un layout bento :
 * 1 hero card (3/5) + 2 side cards (2/5), ou pleine largeur si 1 seule.
 */
export function FeaturedCompanies({ companies, counts }: Props) {
  if (companies.length === 0) return null;

  const [hero, ...rest] = companies;
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
          Entreprises en vedette
        </span>
      </div>

      {side.length === 0 ? (
        <HeroCompanyCard company={hero} jobCount={counts[hero.id] ?? 0} />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-3">
          <div className="lg:col-span-3">
            <HeroCompanyCard
              company={hero}
              jobCount={counts[hero.id] ?? 0}
            />
          </div>
          <div className="lg:col-span-2 flex flex-col gap-3">
            {side.map((c) => (
              <SideCompanyCard
                key={c.id}
                company={c}
                jobCount={counts[c.id] ?? 0}
              />
            ))}
          </div>
        </div>
      )}
    </section>
  );
}

/* ─── Hero card : grande, avec tagline et description ───── */

function HeroCompanyCard({
  company,
  jobCount,
}: {
  company: Company;
  jobCount: number;
}) {
  return (
    <Link
      href={`/entreprises/${company.slug}`}
      className="group relative block bg-white border border-[var(--border)] rounded-2xl overflow-hidden h-full hover:border-foreground/20 hover:shadow-[0_4px_24px_rgba(10,10,10,0.06)] transition-all"
    >
      <span
        className="absolute top-0 left-6 right-6 h-[3px] rounded-b-[4px] transition-all group-hover:left-4 group-hover:right-4"
        style={{ background: company.logoColor }}
      />

      <div className="p-5 sm:p-7 lg:p-8 flex flex-col h-full">
        <div className="flex items-start justify-between gap-4">
          <CompanyLogo
            name={company.name}
            domain={company.domain}
            color={company.logoColor}
            initials={company.initials}
            size={56}
            radius={16}
          />
          <span className="wall-card-arrow shrink-0 size-8 rounded-full border border-[var(--border)] bg-white flex items-center justify-center text-foreground/60 group-hover:text-[var(--accent)] group-hover:border-[var(--accent)]/40 transition-colors">
            <ArrowUpRight width={14} height={14} strokeWidth={2.2} />
          </span>
        </div>

        <div className="flex items-center gap-1.5 mt-4 flex-wrap">
          <span className="wall-badge" data-tone="accent">
            <Sparks /> En vedette
          </span>
          <span className="wall-badge" data-tone="muted">
            {company.sector}
          </span>
          {jobCount > 0 && (
            <span className="wall-badge" data-tone="fresh">
              <Bag /> {jobCount} offre{jobCount > 1 ? "s" : ""}
            </span>
          )}
        </div>

        <h3 className="font-display text-[24px] sm:text-[28px] lg:text-[32px] leading-[1.08] tracking-[-0.015em] text-foreground mt-4 group-hover:text-[var(--accent)] transition-colors">
          {company.name}
        </h3>

        {company.tagline && (
          <p className="font-display italic text-[14px] sm:text-[15px] text-foreground/75 mt-2">
            « {company.tagline} »
          </p>
        )}

        <p className="text-[13.5px] text-muted-foreground leading-[1.6] mt-3 line-clamp-3 max-w-2xl">
          {company.description}
        </p>

        <div className="flex-1 min-h-4" />

        <div className="flex items-center gap-3 mt-5 pt-4 border-t border-[var(--border)] text-[12px] text-foreground/60 flex-wrap">
          <span className="inline-flex items-center gap-1.5">
            <MapPin width={11} height={11} strokeWidth={2} />
            {company.location}
          </span>
          {company.size && (
            <span className="inline-flex items-center gap-1.5">
              <Group width={11} height={11} strokeWidth={2} />
              {company.size}
            </span>
          )}
          {company.founded && (
            <span className="inline-flex items-center gap-1.5">
              <Calendar width={11} height={11} strokeWidth={2} />
              {company.founded}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}

/* ─── Side card : horizontale, compacte ──────────────────── */

function SideCompanyCard({
  company,
  jobCount,
}: {
  company: Company;
  jobCount: number;
}) {
  return (
    <Link
      href={`/entreprises/${company.slug}`}
      className="group relative flex gap-4 bg-white border border-[var(--border)] rounded-2xl overflow-hidden p-4 sm:p-5 hover:border-foreground/20 hover:shadow-[0_4px_24px_rgba(10,10,10,0.06)] transition-all h-full"
    >
      <span
        className="absolute top-0 left-5 right-5 h-[2px] rounded-b-[3px]"
        style={{ background: company.logoColor }}
      />

      <CompanyLogo
        name={company.name}
        domain={company.domain}
        color={company.logoColor}
        initials={company.initials}
        size={48}
        radius={14}
      />

      <div className="flex flex-col flex-1 min-w-0">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="wall-badge" data-tone="accent">
            <Sparks /> En vedette
          </span>
          {jobCount > 0 && (
            <span className="wall-badge" data-tone="fresh">
              <Bag /> {jobCount}
            </span>
          )}
        </div>

        <h3 className="font-display text-[17px] sm:text-[19px] leading-[1.2] tracking-[-0.005em] text-foreground mt-2 line-clamp-2 group-hover:text-[var(--accent)] transition-colors">
          {company.name}
        </h3>

        <p className="text-[12px] text-muted-foreground mt-1">
          {company.sector}
        </p>

        {company.tagline && (
          <p className="text-[12px] text-foreground/65 italic mt-1.5 line-clamp-2 hidden sm:block">
            « {company.tagline} »
          </p>
        )}

        <div className="flex-1 min-h-2" />

        <div className="flex items-center gap-2 mt-3 text-[11px] text-foreground/55">
          <MapPin width={10} height={10} strokeWidth={2} />
          <span className="truncate">{company.location}</span>
        </div>
      </div>
    </Link>
  );
}
