import Link from "next/link";
import { notFound } from "next/navigation";
import { jobs, sectors, type JobType } from "@/lib/data";
import { JobCard } from "@/components/site/job-card";
import { SearchBar } from "@/components/site/search-bar";
import { JobsMapLoader } from "@/components/site/jobs-map-loader";
import { isLocale, lhref, type Locale } from "@/lib/i18n/config";
import { getDict } from "@/lib/i18n/dict";

const jobTypes: JobType[] = [
  "CDI",
  "CDD",
  "Stage",
  "Alternance",
  "Freelance",
  "Saison",
];

export default async function JobsPage(props: PageProps<"/[locale]/jobs">) {
  const { locale } = await props.params;
  if (!isLocale(locale)) notFound();
  const t = getDict(locale).jobs;
  const sp = await props.searchParams;
  const q = (sp.q as string | undefined)?.toLowerCase() || "";
  const sector = sp.sector as string | undefined;
  const type = sp.type as string | undefined;

  const filtered = jobs.filter((j) => {
    if (q) {
      const hay = (
        j.title +
        " " +
        j.shortDescription +
        " " +
        j.tags.join(" ") +
        " " +
        j.company.name
      ).toLowerCase();
      if (!hay.includes(q)) return false;
    }
    if (sector && j.sector !== sector) return false;
    if (type && j.type !== type) return false;
    return true;
  });

  return (
    <div>
      {/* HEADER */}
      <section className="border-b border-border bg-background">
        <div className="mx-auto max-w-[1280px] px-5 pt-14 pb-10 lg:px-8">
          <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
            {t.heroEyebrow}
          </p>
          <h1 className="mt-3 max-w-3xl font-display text-[36px] font-semibold leading-[1.05] tracking-tight text-foreground sm:text-[48px]">
            {t.heroTitle(filtered.length)}
          </h1>
          <div className="mt-8 max-w-3xl">
            <SearchBar
              locale={locale}
              defaultQ={q}
              defaultSector={sector || ""}
            />
          </div>

          <div className="mt-7 space-y-3">
            <FilterRow
              label={t.contractLabel}
              items={[
                { value: undefined, label: t.all },
                ...jobTypes.map((tp) => ({ value: tp, label: tp })),
              ]}
              activeValue={type}
              paramKey="type"
              sp={sp}
              locale={locale}
            />
            <FilterRow
              label={t.sectorLabel}
              items={[
                { value: undefined, label: t.all },
                ...sectors.map((s) => ({ value: s.name, label: s.name })),
              ]}
              activeValue={sector}
              paramKey="sector"
              sp={sp}
              locale={locale}
            />
          </div>
        </div>
      </section>

      {/* SPLIT VIEW : list + map */}
      <section className="bg-background">
        <div className="grid lg:grid-cols-[1fr_minmax(0,580px)]">
          <div className="border-r border-border">
            <div className="mx-auto max-w-[820px] px-5 py-10 lg:px-8">
              {filtered.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-border bg-muted/30 p-16 text-center">
                  <p className="font-display text-[22px] font-semibold">
                    {t.empty}
                  </p>
                  <p className="mt-2 text-[14px] text-muted-foreground">
                    {t.emptyHint}
                  </p>
                  <Link
                    href={lhref(locale, "/jobs")}
                    className="mt-5 inline-flex rounded-full bg-foreground px-5 py-2.5 text-[13px] font-semibold text-background transition hover:bg-foreground/85"
                  >
                    {t.reset}
                  </Link>
                </div>
              ) : (
                <div className="grid gap-5 sm:grid-cols-2">
                  {filtered.map((j) => (
                    <JobCard key={j.id} job={j} locale={locale} />
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="sticky top-[68px] hidden h-[calc(100vh-68px)] overflow-hidden lg:block">
            <JobsMapLoader jobs={filtered} locale={locale} />
          </div>
        </div>

        {/* Mobile : map under list */}
        <div className="block border-t border-border lg:hidden">
          <div className="border-b border-border bg-muted/40 px-5 py-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
            {t.mapHeader}
          </div>
          <div className="h-[420px]">
            <JobsMapLoader jobs={filtered} locale={locale} />
          </div>
        </div>
      </section>
    </div>
  );
}

function FilterRow({
  label,
  items,
  activeValue,
  paramKey,
  sp,
  locale,
}: {
  label: string;
  items: { value: string | undefined; label: string }[];
  activeValue: string | undefined;
  paramKey: string;
  sp: { [k: string]: string | string[] | undefined };
  locale: Locale;
}) {
  return (
    <div className="flex items-baseline gap-4">
      <span className="shrink-0 text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
        {label}
      </span>
      <div className="flex flex-wrap items-center gap-2">
        {items.map((it, i) => {
          const isActive = activeValue
            ? it.value === activeValue
            : it.value === undefined;
          return (
            <Link
              key={i}
              href={buildHref(sp, paramKey, it.value, locale)}
              className={`rounded-full border px-3 py-1.5 text-[12.5px] font-medium transition ${
                isActive
                  ? "border-foreground bg-foreground text-background"
                  : "border-border bg-card text-muted-foreground hover:border-foreground hover:text-foreground"
              }`}
            >
              {it.label}
            </Link>
          );
        })}
      </div>
    </div>
  );
}

function buildHref(
  sp: { [k: string]: string | string[] | undefined },
  key: string,
  value: string | undefined,
  locale: Locale,
) {
  const params = new URLSearchParams();
  Object.entries(sp).forEach(([k, v]) => {
    if (k === key || k === "locale") return;
    if (typeof v === "string") params.set(k, v);
  });
  if (value) params.set(key, value);
  const qs = params.toString();
  return lhref(locale, `/jobs${qs ? `?${qs}` : ""}`);
}
