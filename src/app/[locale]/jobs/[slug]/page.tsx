import Link from "next/link";
import { notFound } from "next/navigation";
import { getJob, jobs, formatSalary, relativeDate } from "@/lib/data";
import { CompanyLogo } from "@/components/site/company-logo";
import { JobCard } from "@/components/site/job-card";
import { JobsMapLoader } from "@/components/site/jobs-map-loader";
import { isLocale, lhref, locales } from "@/lib/i18n/config";
import { getDict } from "@/lib/i18n/dict";
import {
  ArrowLeft,
  ArrowRight,
  MapPin,
  Briefcase,
  GraduationCap,
  Clock,
  Languages,
  Banknote,
  Wifi,
  CheckCircle2,
  Bookmark,
  Share2,
} from "lucide-react";

export function generateStaticParams() {
  return locales.flatMap((locale) =>
    jobs.map((j) => ({ locale, slug: j.slug })),
  );
}

export default async function JobDetailPage(
  props: PageProps<"/[locale]/jobs/[slug]">,
) {
  const { locale, slug } = await props.params;
  if (!isLocale(locale)) notFound();
  const job = getJob(slug);
  if (!job) notFound();
  const t = getDict(locale).jobs;

  const salary = formatSalary(job);
  const similar = jobs
    .filter((j) => j.id !== job.id && j.sector === job.sector)
    .slice(0, 3);

  return (
    <div>
      <div className="mx-auto max-w-[1280px] px-5 pt-8 lg:px-8">
        <Link
          href={lhref(locale, "/jobs")}
          className="inline-flex items-center gap-1.5 text-[13px] font-medium text-muted-foreground transition hover:text-foreground"
        >
          <ArrowLeft className="h-3.5 w-3.5" strokeWidth={2.25} />
          {t.backToList}
        </Link>
      </div>

      <section className="mx-auto max-w-[1280px] px-5 py-8 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
          <article>
            <div className="hw-shadow-card rounded-2xl border border-border bg-card p-6 sm:p-8">
              <div className="flex flex-wrap items-start gap-5">
                <CompanyLogo company={job.company} size={64} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-3">
                    <Link
                      href={lhref(locale, `/companies/${job.company.slug}`)}
                      className="text-[14px] font-medium text-muted-foreground transition hover:text-foreground"
                    >
                      {job.company.name}
                    </Link>
                    <span className="rounded-md border border-border bg-background px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                      {job.lang}
                    </span>
                  </div>
                  <h1 className="mt-1 font-display text-[30px] font-semibold leading-tight tracking-tight text-foreground sm:text-[36px]">
                    {job.title}
                  </h1>
                </div>
              </div>

              <div className="mt-6 flex flex-wrap gap-2">
                <Chip icon={Briefcase}>{job.type}</Chip>
                <Chip icon={GraduationCap}>{job.level}</Chip>
                <Chip icon={MapPin}>{job.location}</Chip>
                <Chip icon={Wifi}>{job.remote}</Chip>
                {salary && <Chip icon={Banknote}>{salary}</Chip>}
                <Chip icon={Clock}>{relativeDate(job.postedAt)}</Chip>
              </div>
            </div>

            <Section title={locale === "fr" ? "Le poste" : "About the role"}>
              <p className="text-[16px] leading-[1.75] text-foreground/85">
                {job.description}
              </p>
            </Section>

            <Section title={locale === "fr" ? "Vos missions" : "What you'll do"}>
              <ul className="space-y-3">
                {job.responsibilities.map((r) => (
                  <li
                    key={r}
                    className="flex gap-3 text-[15px] leading-relaxed text-foreground/85"
                  >
                    <CheckCircle2
                      className="mt-0.5 h-5 w-5 shrink-0 text-foreground"
                      strokeWidth={1.75}
                    />
                    <span>{r}</span>
                  </li>
                ))}
              </ul>
            </Section>

            <Section
              title={
                locale === "fr" ? "Profil recherché" : "Who we're looking for"
              }
            >
              <ul className="space-y-3">
                {job.requirements.map((r) => (
                  <li
                    key={r}
                    className="flex gap-3 text-[15px] leading-relaxed text-foreground/85"
                  >
                    <CheckCircle2
                      className="mt-0.5 h-5 w-5 shrink-0 text-foreground"
                      strokeWidth={1.75}
                    />
                    <span>{r}</span>
                  </li>
                ))}
              </ul>
            </Section>

            <Section title={locale === "fr" ? "Avantages" : "Benefits"}>
              <ul className="grid gap-3 sm:grid-cols-2">
                {job.benefits.map((b) => (
                  <li
                    key={b}
                    className="rounded-xl border border-border bg-card p-4 text-[14px] text-foreground/85"
                  >
                    {b}
                  </li>
                ))}
              </ul>
            </Section>

            <Section title={locale === "fr" ? "Langues" : "Languages"}>
              <div className="flex flex-wrap gap-2">
                {job.languages.map((l) => (
                  <span
                    key={l}
                    className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5 text-[13px]"
                  >
                    <Languages className="h-3.5 w-3.5" strokeWidth={2} />
                    {l}
                  </span>
                ))}
              </div>
            </Section>
          </article>

          <aside className="space-y-4">
            <div className="sticky top-[88px] space-y-4">
              <div className="hw-shadow-card rounded-2xl border border-border bg-card p-6">
                <button className="group inline-flex w-full items-center justify-center gap-2 rounded-full bg-accent py-3.5 text-[14px] font-semibold text-accent-foreground transition hover:bg-[var(--accent-hover)]">
                  {t.apply}
                  <ArrowRight
                    className="h-3.5 w-3.5 transition group-hover:translate-x-0.5"
                    strokeWidth={2.5}
                  />
                </button>
                <div className="mt-2 grid grid-cols-2 gap-2">
                  <button className="inline-flex items-center justify-center gap-1.5 rounded-full border border-border py-2.5 text-[12.5px] font-medium text-foreground transition hover:border-foreground">
                    <Bookmark className="h-3.5 w-3.5" strokeWidth={2.25} />
                    {t.save}
                  </button>
                  <button className="inline-flex items-center justify-center gap-1.5 rounded-full border border-border py-2.5 text-[12.5px] font-medium text-foreground transition hover:border-foreground">
                    <Share2 className="h-3.5 w-3.5" strokeWidth={2.25} />
                    {t.share}
                  </button>
                </div>
              </div>

              <div className="hw-shadow-card overflow-hidden rounded-2xl border border-border bg-card">
                <div className="border-b border-border px-5 py-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                  {locale === "fr" ? "Localisation" : "Location"}
                </div>
                <div className="h-[260px]">
                  <JobsMapLoader jobs={[job]} locale={locale} />
                </div>
                <div className="border-t border-border px-5 py-3 text-[13px] text-foreground">
                  {job.location}
                </div>
              </div>

              <div className="hw-shadow-card rounded-2xl border border-border bg-card p-6">
                <div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                  {locale === "fr" ? "L'entreprise" : "About the company"}
                </div>
                <div className="mt-4 flex items-center gap-3">
                  <CompanyLogo company={job.company} size={48} />
                  <div className="min-w-0">
                    <p className="font-display text-[16px] font-semibold text-foreground">
                      {job.company.name}
                    </p>
                    <p className="text-[12px] text-muted-foreground">
                      {job.company.size} · {job.company.location}
                    </p>
                  </div>
                </div>
                <p className="mt-4 line-clamp-4 text-[13px] leading-relaxed text-muted-foreground">
                  {job.company.description}
                </p>
                <Link
                  href={lhref(locale, `/companies/${job.company.slug}`)}
                  className="mt-4 inline-flex items-center gap-1.5 text-[13px] font-semibold text-foreground hover:underline"
                >
                  {locale === "fr" ? "Voir le profil" : "View profile"}
                  <ArrowRight className="h-3.5 w-3.5" strokeWidth={2.5} />
                </Link>
              </div>
            </div>
          </aside>
        </div>
      </section>

      {similar.length > 0 && (
        <section className="border-t border-border bg-background py-20">
          <div className="mx-auto max-w-[1280px] px-5 lg:px-8">
            <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
              {t.similarEyebrow}
            </p>
            <h2 className="mt-3 font-display text-[28px] font-semibold leading-tight text-foreground sm:text-[36px]">
              {t.similar}
            </h2>
            <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {similar.map((j) => (
                <JobCard key={j.id} job={j} locale={locale} />
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}

function Chip({
  icon: Icon,
  children,
}: {
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  children: React.ReactNode;
}) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-secondary px-3 py-1.5 text-[12.5px] font-medium text-foreground">
      <Icon className="h-3.5 w-3.5" strokeWidth={2} />
      {children}
    </span>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mt-8 rounded-2xl border border-border bg-card p-6 sm:p-8">
      <h2 className="font-display text-[22px] font-semibold leading-tight text-foreground">
        {title}
      </h2>
      <div className="mt-5">{children}</div>
    </section>
  );
}
