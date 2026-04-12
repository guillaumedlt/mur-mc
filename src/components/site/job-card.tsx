import Link from "next/link";
import { CompanyLogo } from "./company-logo";
import type { Job } from "@/lib/data";
import { formatSalary, relativeDate } from "@/lib/data";
import { type Locale, lhref } from "@/lib/i18n/config";
import { MapPin, Clock, ArrowUpRight } from "lucide-react";

export function JobCard({ job, locale }: { job: Job; locale: Locale }) {
  const salary = formatSalary(job);
  return (
    <Link
      href={lhref(locale, `/jobs/${job.slug}`)}
      className="group hw-shadow-card relative flex h-full flex-col gap-4 rounded-2xl border border-border bg-card p-6 transition"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3.5">
          <CompanyLogo company={job.company} size={42} />
          <div className="min-w-0 pt-0.5">
            <p className="text-[12.5px] font-medium text-muted-foreground">
              {job.company.name}
            </p>
            <h3 className="mt-1 line-clamp-2 font-display text-[17px] font-semibold leading-snug text-foreground">
              {job.title}
            </h3>
          </div>
        </div>
        <span
          className="shrink-0 rounded-md border border-border bg-background px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground"
          aria-label={
            job.lang === "fr"
              ? "Offre publiée en français"
              : "Job posted in English"
          }
        >
          {job.lang}
        </span>
      </div>

      <p className="line-clamp-2 text-[13.5px] leading-relaxed text-muted-foreground">
        {job.shortDescription}
      </p>

      <div className="mt-auto flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-border pt-4 text-[12.5px] text-muted-foreground">
        <span className="inline-flex items-center gap-1.5">
          <MapPin className="h-3.5 w-3.5" strokeWidth={2} />
          {job.location}
        </span>
        <span aria-hidden>·</span>
        <span>{job.type}</span>
        {salary && (
          <>
            <span aria-hidden>·</span>
            <span className="font-medium text-foreground">{salary}</span>
          </>
        )}
        <span className="ml-auto inline-flex items-center gap-1">
          <Clock className="h-3 w-3" strokeWidth={2} />
          {relativeDate(job.postedAt)}
        </span>
      </div>

      <ArrowUpRight
        className="absolute right-5 top-5 h-4 w-4 text-muted-foreground opacity-0 transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:opacity-100"
        strokeWidth={2.25}
      />
    </Link>
  );
}
