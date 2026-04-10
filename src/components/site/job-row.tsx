import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import type { Job } from "@/lib/data";
import { relativeDate } from "@/lib/data";
import { type Locale, lhref } from "@/lib/i18n/config";

/**
 * Horizontal full-width job row, used in editorial lists (home, jobs index).
 * No company logo, no salary — keeps every listing visually equal.
 */
export function JobRow({ job, locale }: { job: Job; locale: Locale }) {
  return (
    <Link
      href={lhref(locale, `/jobs/${job.slug}`)}
      className="group flex items-start justify-between gap-6 px-2 py-6 transition hover:bg-muted/40 sm:px-4"
    >
      <div className="min-w-0 flex-1">
        <p className="text-[12.5px] font-medium text-muted-foreground">
          {job.company.name}
        </p>
        <h3 className="mt-1 font-display text-[19px] font-semibold leading-snug text-foreground sm:text-[21px]">
          {job.title}
        </h3>
        <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-[13px] text-muted-foreground">
          <span>{job.type}</span>
          <span aria-hidden>·</span>
          <span>{job.sector}</span>
          <span aria-hidden>·</span>
          <span>{job.remote}</span>
          <span aria-hidden>·</span>
          <span>{relativeDate(job.postedAt)}</span>
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-3 pt-1">
        <span
          className="rounded-md border border-border bg-background px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground"
          aria-label={
            job.lang === "fr"
              ? "Offre publiée en français"
              : "Job posted in English"
          }
        >
          {job.lang}
        </span>
        <ArrowUpRight
          className="h-4 w-4 text-muted-foreground transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-foreground"
          strokeWidth={2.25}
        />
      </div>
    </Link>
  );
}
