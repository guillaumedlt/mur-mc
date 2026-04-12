import Link from "next/link";
import { notFound } from "next/navigation";
import { SearchBar } from "@/components/site/search-bar";
import { JobRow } from "@/components/site/job-row";
import { jobs, sectors, companies } from "@/lib/data";
import { isLocale, lhref } from "@/lib/i18n/config";
import { getDict } from "@/lib/i18n/dict";
import {
  Bank,
  SeaWaves,
  GlassHalf,
  Crown,
  Code,
  Building,
  BookStack,
  Trophy,
  Calendar,
  HomeUser,
} from "iconoir-react";

const sectorIcons: Record<
  string,
  React.ComponentType<{ className?: string; strokeWidth?: number }>
> = {
  "Banque & Finance": Bank,
  Yachting: SeaWaves,
  "Hôtellerie & Restauration": GlassHalf,
  "Luxe & Retail": Crown,
  "Tech & Digital": Code,
  Immobilier: Building,
  Juridique: BookStack,
  "Sport & Bien-être": Trophy,
  Événementiel: Calendar,
  "Famille / Office": HomeUser,
};

export default async function Home(props: PageProps<"/[locale]">) {
  const { locale } = await props.params;
  if (!isLocale(locale)) notFound();
  const t = getDict(locale).home;

  // Featured d'abord, puis le reste — on en montre 12
  const listJobs = [
    ...jobs.filter((j) => j.featured),
    ...jobs.filter((j) => !j.featured),
  ].slice(0, 12);

  return (
    <div>
      {/* HERO */}
      <section className="relative overflow-hidden border-b border-border bg-background">
        <div
          className="hw-hero-blobs pointer-events-none absolute inset-0 -z-10"
          aria-hidden
        />
        <div className="relative mx-auto max-w-[1200px] px-5 pt-24 pb-24 sm:pt-32 lg:px-8 lg:pt-40 lg:pb-32">
          <div className="mx-auto max-w-4xl text-center">
            <h1 className="font-display text-[52px] font-semibold leading-[0.95] tracking-[-0.035em] text-foreground sm:text-[76px] lg:text-[100px]">
              {t.title1}
              <br />
              {t.title2} <span className="italic">{t.titleHighlight}</span>.
            </h1>
            <p className="mx-auto mt-9 max-w-xl text-[17px] leading-relaxed text-muted-foreground sm:text-[18px]">
              {t.subtitle}
            </p>
            <div className="mx-auto mt-12 max-w-2xl">
              <SearchBar locale={locale} />
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 2 — Liste des offres récentes */}
      <section className="border-b border-border bg-background">
        <div className="mx-auto max-w-[1024px] px-5 pt-20 pb-16 lg:px-8">
          <div className="flex items-baseline justify-between gap-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
              {t.latestEyebrow}
            </p>
            <div className="flex items-baseline gap-5 text-[13px]">
              <span className="text-muted-foreground">
                {t.jobsCount(jobs.length)}
              </span>
              <Link
                href={lhref(locale, "/jobs")}
                className="font-medium text-foreground hover:underline"
              >
                {t.seeAll}
              </Link>
            </div>
          </div>

          <div className="mt-8 border-t border-border">
            {listJobs.map((j) => (
              <div key={j.id} className="border-b border-border">
                <JobRow job={j} locale={locale} />
              </div>
            ))}
          </div>

          <div className="mt-12 flex justify-center">
            <Link
              href={lhref(locale, "/jobs")}
              className="inline-flex items-center gap-2 rounded-full border border-foreground px-6 py-3 text-[13px] font-medium text-foreground transition hover:bg-foreground hover:text-background"
            >
              {t.seeAllJobs}
            </Link>
          </div>
        </div>
      </section>

      {/* SECTION 3 — Parcourir par secteur */}
      <section className="border-b border-border bg-background">
        <div className="mx-auto max-w-[1280px] px-5 py-20 lg:px-8">
          <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
            {t.bySectorEyebrow}
          </p>

          <div className="mt-8 grid grid-cols-1 border border-border bg-background sm:grid-cols-2 lg:grid-cols-5">
            {sectors.map((s, i) => {
              const Icon = sectorIcons[s.name];
              const lgCols = 5;
              const smCols = 2;
              return (
                <Link
                  key={s.name}
                  href={lhref(
                    locale,
                    `/jobs?sector=${encodeURIComponent(s.name)}`,
                  )}
                  className={`group flex items-start gap-4 px-5 py-6 transition hover:bg-muted/40 ${
                    i % smCols !== 0 ? "sm:border-l sm:border-border" : ""
                  } ${i >= smCols ? "sm:border-t sm:border-border" : ""} ${
                    i % lgCols !== 0 ? "lg:border-l lg:border-border" : ""
                  } ${
                    i >= lgCols
                      ? "lg:border-t lg:border-border"
                      : "lg:border-t-0"
                  } ${
                    i !== sectors.length - 1
                      ? "border-b border-border sm:border-b-0"
                      : ""
                  }`}
                >
                  {Icon && (
                    <Icon
                      className="mt-0.5 h-[22px] w-[22px] shrink-0 text-foreground"
                      strokeWidth={1.5}
                    />
                  )}
                  <div className="min-w-0">
                    <span className="block font-display text-[16px] font-semibold leading-tight text-foreground transition group-hover:underline">
                      {s.name}
                    </span>
                    <span className="mt-1 block text-[12px] text-muted-foreground">
                      {s.count}
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* SECTION 4 — Entreprises qui recrutent */}
      <section className="border-b border-border bg-background">
        <div className="mx-auto max-w-[1280px] px-5 py-20 lg:px-8">
          <div className="flex items-baseline justify-between gap-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
              {t.hiringEyebrow}
            </p>
            <Link
              href={lhref(locale, "/companies")}
              className="text-[13px] font-medium text-foreground hover:underline"
            >
              {t.seeAllCompanies}
            </Link>
          </div>

          <div className="mt-10 flex flex-wrap gap-x-10 gap-y-5">
            {companies.map((c) => (
              <Link
                key={c.id}
                href={lhref(locale, `/companies/${c.slug}`)}
                className="font-display text-[18px] font-medium text-muted-foreground transition hover:text-foreground sm:text-[20px]"
              >
                {c.name}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* SECTION 5 — Alerte email */}
      <section className="border-b border-border bg-muted/40">
        <div className="mx-auto max-w-[700px] px-5 py-24 text-center lg:px-8">
          <h2 className="font-display text-[28px] font-semibold leading-tight tracking-tight text-foreground sm:text-[34px]">
            {t.alertTitle}
          </h2>
          <p className="mx-auto mt-4 max-w-md text-[15px] leading-relaxed text-muted-foreground">
            {t.alertDesc}
          </p>

          <form className="mx-auto mt-10 flex max-w-md flex-col gap-2 sm:flex-row">
            <input
              type="email"
              required
              placeholder={t.alertEmailPlaceholder}
              className="flex-1 rounded-full border border-border bg-background px-5 py-3 text-[14px] text-foreground outline-none placeholder:text-muted-foreground transition focus:border-foreground"
            />
            <button
              type="submit"
              className="rounded-full bg-accent px-6 py-3 text-[13px] font-semibold text-accent-foreground transition hover:bg-[var(--accent-hover)]"
            >
              {t.alertSubmit}
            </button>
          </form>
        </div>
      </section>
    </div>
  );
}
