import Link from "next/link";
import { notFound } from "next/navigation";
import { companies, getCompany, jobs } from "@/lib/data";
import { CompanyLogo } from "@/components/site/company-logo";
import { JobCard } from "@/components/site/job-card";
import { isLocale, lhref, locales } from "@/lib/i18n/config";
import { ArrowLeft, MapPin, Users, Calendar, Globe } from "lucide-react";

export function generateStaticParams() {
  return locales.flatMap((locale) =>
    companies.map((c) => ({ locale, slug: c.slug })),
  );
}

export default async function CompanyPage(
  props: PageProps<"/[locale]/companies/[slug]">,
) {
  const { locale, slug } = await props.params;
  if (!isLocale(locale)) notFound();
  const company = getCompany(slug);
  if (!company) notFound();

  const companyJobs = jobs.filter((j) => j.company.id === company.id);

  return (
    <div>
      <div className="mx-auto max-w-[1280px] px-5 pt-8 lg:px-8">
        <Link
          href={lhref(locale, "/companies")}
          className="inline-flex items-center gap-1.5 text-[13px] font-medium text-muted-foreground transition hover:text-foreground"
        >
          <ArrowLeft className="h-3.5 w-3.5" strokeWidth={2.25} />
          {locale === "fr" ? "Toutes les entreprises" : "All companies"}
        </Link>
      </div>

      <section className="mx-auto max-w-[1280px] px-5 py-10 lg:px-8">
        <div className="hw-shadow-card rounded-2xl border border-border bg-card p-8 sm:p-10">
          <div className="flex flex-wrap items-start gap-6">
            <CompanyLogo company={company} size={88} />
            <div className="min-w-0 flex-1">
              <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                {company.sector}
              </p>
              <h1 className="mt-2 font-display text-[36px] font-semibold leading-tight tracking-tight text-foreground sm:text-[44px]">
                {company.name}
              </h1>
              <div className="mt-5 flex flex-wrap gap-x-5 gap-y-2 text-[13px] text-muted-foreground">
                <span className="inline-flex items-center gap-1.5">
                  <MapPin className="h-3.5 w-3.5" strokeWidth={2} />
                  {company.location}
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Users className="h-3.5 w-3.5" strokeWidth={2} />
                  {company.size}{" "}
                  {locale === "fr" ? "collaborateurs" : "employees"}
                </span>
                {company.founded && (
                  <span className="inline-flex items-center gap-1.5">
                    <Calendar className="h-3.5 w-3.5" strokeWidth={2} />
                    {locale === "fr" ? "Fondée en" : "Founded"}{" "}
                    {company.founded}
                  </span>
                )}
                {company.website && (
                  <span className="inline-flex items-center gap-1.5">
                    <Globe className="h-3.5 w-3.5" strokeWidth={2} />
                    {company.website}
                  </span>
                )}
              </div>
            </div>
          </div>

          <p className="mt-7 max-w-3xl text-[16px] leading-relaxed text-foreground/85">
            {company.description}
          </p>

          {company.perks.length > 0 && (
            <div className="mt-7">
              <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                {locale === "fr" ? "Avantages" : "Benefits"}
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                {company.perks.map((p) => (
                  <span
                    key={p}
                    className="inline-flex items-center rounded-full border border-border bg-background px-3 py-1 text-[12.5px] text-foreground"
                  >
                    {p}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="mt-14">
          <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
            {locale === "fr" ? "Opportunités ouvertes" : "Open positions"}
          </p>
          <h2 className="mt-3 font-display text-[28px] font-semibold leading-tight text-foreground sm:text-[36px]">
            {companyJobs.length}{" "}
            {locale === "fr"
              ? `poste${companyJobs.length > 1 ? "s" : ""} à pourvoir`
              : `open role${companyJobs.length > 1 ? "s" : ""}`}
          </h2>

          {companyJobs.length === 0 ? (
            <p className="mt-6 text-[14px] text-muted-foreground">
              {locale === "fr"
                ? "Aucune opportunité publiée pour le moment."
                : "No openings published at the moment."}
            </p>
          ) : (
            <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {companyJobs.map((j) => (
                <JobCard key={j.id} job={j} locale={locale} />
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
