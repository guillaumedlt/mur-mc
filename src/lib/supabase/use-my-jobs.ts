"use client";

import { useState } from "react";
import { useUser } from "@/lib/auth";
import { createClient } from "./client";

export type MyJob = {
  id: string;
  slug: string;
  title: string;
  type: string;
  level: string;
  sector: string;
  location: string;
  remote: string;
  work_time: string;
  salary_min: number | null;
  salary_max: number | null;
  lang: string;
  languages: string[];
  tags: string[];
  short_description: string;
  description: string;
  responsibilities: string[];
  requirements: string[];
  benefits: string[];
  status: string;
  featured: boolean;
  views: number;
  created_at: string;
  updated_at: string;
  applicationsCount: number;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapMyJob(j: any): MyJob {
  return {
    id: j.id,
    slug: j.slug,
    title: j.title,
    type: j.type,
    level: j.level,
    sector: j.sector,
    location: j.location,
    remote: j.remote,
    work_time: j.work_time,
    salary_min: j.salary_min,
    salary_max: j.salary_max,
    lang: j.lang,
    languages: j.languages ?? [],
    tags: j.tags ?? [],
    short_description: j.short_description ?? "",
    description: j.description ?? "",
    responsibilities: j.responsibilities ?? [],
    requirements: j.requirements ?? [],
    benefits: j.benefits ?? [],
    status: j.status,
    featured: j.featured,
    views: j.views ?? 0,
    created_at: j.created_at,
    updated_at: j.updated_at ?? j.created_at,
    applicationsCount:
      Array.isArray(j.applications) && j.applications.length > 0
        ? j.applications[0]?.count ?? 0
        : 0,
  };
}

/**
 * Hook client : charge les offres du recruteur connecte depuis Supabase.
 */
export function useMyJobs() {
  const user = useUser();
  const [jobs, setJobs] = useState<MyJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchedFor, setFetchedFor] = useState<string | null>(null);

  const companyId = user?.companyId ?? null;
  if (companyId !== fetchedFor) {
    setFetchedFor(companyId);
    if (!companyId) {
      setJobs([]);
      setLoading(false);
    } else {
      setLoading(true);
      const supabase = createClient();
      supabase
        .from("jobs")
        .select("*, applications(count)")
        .eq("company_id", companyId)
        .order("created_at", { ascending: false })
        .then(({ data }) => {
          if (data) {
            setJobs(data.map(mapMyJob));
          }
          setLoading(false);
        });
    }
  }

  const refetch = () => setFetchedFor(null);

  return { jobs, loading, refetch };
}

/**
 * Hook client : charge une offre par ID depuis Supabase.
 */
export function useMyJob(jobId: string | null) {
  const [job, setJob] = useState<MyJob | null>(null);
  const [loading, setLoading] = useState(true);
  const [fetchedFor, setFetchedFor] = useState<string | null>(null);

  if (jobId !== fetchedFor) {
    setFetchedFor(jobId);
    if (!jobId) {
      setJob(null);
      setLoading(false);
    } else {
      setLoading(true);
      const supabase = createClient();
      supabase
        .from("jobs")
        .select("*, applications(count)")
        .eq("id", jobId)
        .single()
        .then(({ data }) => {
          setJob(data ? mapMyJob(data) : null);
          setLoading(false);
        });
    }
  }

  const refetch = () => setFetchedFor(null);

  return { job, loading, refetch };
}

/**
 * Actions Supabase sur les offres (pause, close, delete, update).
 */
export async function updateJobSupabase(
  jobId: string,
  patch: Record<string, unknown>,
): Promise<void> {
  const supabase = createClient();
  await supabase.from("jobs").update(patch).eq("id", jobId);
}

export async function deleteJobSupabase(jobId: string): Promise<void> {
  const supabase = createClient();
  await supabase.from("jobs").delete().eq("id", jobId);
}
