"use client";

import dynamic from "next/dynamic";
import type { Job } from "@/lib/data";
import type { Locale } from "@/lib/i18n/config";

const JobsMap = dynamic(() => import("./jobs-map"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full w-full items-center justify-center bg-muted">
      <p className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
        Loading map…
      </p>
    </div>
  ),
});

export function JobsMapLoader({
  jobs,
  locale,
}: {
  jobs: Job[];
  locale: Locale;
}) {
  return <JobsMap jobs={jobs} locale={locale} />;
}
