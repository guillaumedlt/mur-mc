"use client";

import Link from "next/link";
import { ArrowLeft } from "iconoir-react";
import { useMyJob } from "@/lib/supabase/use-my-jobs";
import { PublishJobForm } from "./publish-job-form";

export function EditJobPage({ jobId }: { jobId: string }) {
  const { job, loading } = useMyJob(jobId);

  if (loading) {
    return (
      <div className="max-w-[820px] mx-auto bg-white border border-[var(--border)] rounded-2xl p-12 flex items-center justify-center">
        <span className="size-6 border-2 border-foreground/20 border-t-foreground rounded-full animate-spin" />
      </div>
    );
  }

  if (!job) {
    return (
      <div className="max-w-[820px] mx-auto bg-white border border-[var(--border)] rounded-2xl p-12 text-center">
        <p className="font-display italic text-[18px] text-foreground">Offre introuvable.</p>
        <Link href="/recruteur/offres" className="inline-flex h-10 mt-5 px-5 rounded-full bg-foreground text-background text-[13px] items-center">
          Mes offres
        </Link>
      </div>
    );
  }

  // Map MyJob to the shape expected by PublishJobForm's existing prop
  const existing = {
    id: job.id,
    companyId: "",
    slug: job.slug,
    title: job.title,
    type: job.type as any,
    level: job.level as any,
    sector: job.sector as any,
    location: job.location,
    remote: job.remote as any,
    workTime: job.work_time as any,
    lang: (job.lang ?? "fr") as any,
    languages: job.languages,
    salaryMin: job.salary_min ?? undefined,
    salaryMax: job.salary_max ?? undefined,
    shortDescription: job.short_description,
    description: job.description,
    responsibilities: job.responsibilities,
    requirements: job.requirements,
    benefits: job.benefits,
    tags: job.tags,
    status: job.status as any,
    views: job.views,
    createdAt: job.created_at,
    updatedAt: job.updated_at,
  };

  return (
    <PublishJobForm
      existing={existing}
      onCancel={() => window.history.back()}
    />
  );
}
