"use client";

import Link from "next/link";
import { useMyJob } from "@/lib/supabase/use-my-jobs";
import { PublishJobForm } from "./publish-job-form";
import type {
  EmployerJob,
  EmployerJobStatus,
} from "@/lib/employer-store";
import type {
  ExperienceLevel,
  JobType,
  Sector,
  WorkTime,
} from "@/lib/data";

type RawJob = {
  id: string;
  slug: string;
  title: string;
  type: string;
  level: string;
  sector: string;
  location: string;
  remote: string;
  work_time: string;
  lang: string | null;
  languages: string[];
  salary_min: number | null;
  salary_max: number | null;
  short_description: string;
  description: string;
  responsibilities: string[];
  requirements: string[];
  benefits: string[];
  tags: string[];
  status: string;
  views: number;
  created_at: string;
  updated_at: string;
};

/**
 * Mappe une row Supabase `jobs` vers le shape attendu par PublishJobForm.
 * Les valeurs string brutes de la DB sont contraintes via les unions
 * typees de @/lib/data + employer-store.
 */
function mapDbJobToEmployerJob(j: RawJob): EmployerJob {
  return {
    id: j.id,
    companyId: "",
    slug: j.slug,
    title: j.title,
    type: j.type as JobType,
    level: j.level as ExperienceLevel,
    sector: j.sector as Sector,
    location: j.location,
    remote: j.remote as EmployerJob["remote"],
    workTime: j.work_time as WorkTime,
    lang: (j.lang ?? "fr") as "fr" | "en",
    languages: j.languages,
    salaryMin: j.salary_min ?? undefined,
    salaryMax: j.salary_max ?? undefined,
    shortDescription: j.short_description,
    description: j.description,
    responsibilities: j.responsibilities,
    requirements: j.requirements,
    benefits: j.benefits,
    tags: j.tags,
    status: j.status as EmployerJobStatus,
    views: j.views,
    createdAt: j.created_at,
    updatedAt: j.updated_at,
  };
}

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

  const existing = mapDbJobToEmployerJob(job as RawJob);

  return (
    <PublishJobForm
      existing={existing}
      onCancel={() => window.history.back()}
    />
  );
}
