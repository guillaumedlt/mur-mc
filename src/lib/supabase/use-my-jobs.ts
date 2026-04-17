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
  /** Criteres customises de scorecard (null = fallback aux 6 par defaut). */
  scorecard_criteria: string[] | null;
  /** Profile id du recruteur assigne a cette offre (null = pas d'owner). */
  assigned_to: string | null;
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
    scorecard_criteria: Array.isArray(j.scorecard_criteria)
      ? (j.scorecard_criteria as unknown[]).map((x) => String(x))
      : null,
    assigned_to: j.assigned_to ?? null,
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

/**
 * Clone une offre existante en brouillon. Retourne l'id du nouveau job.
 * Copie tous les champs sauf l'id, le slug (regenere), les metrics (views),
 * et force le status a "draft".
 */
export async function cloneJobSupabase(
  jobId: string,
): Promise<{ ok: boolean; error?: string; id?: string }> {
  const supabase = createClient();

  const { data: source, error: fetchErr } = await supabase
    .from("jobs")
    .select("*")
    .eq("id", jobId)
    .single();

  if (fetchErr || !source) {
    return { ok: false, error: fetchErr?.message ?? "Offre introuvable" };
  }

  const baseSlug = (source.slug as string).replace(/-[a-z0-9]{5}$/, "");
  const newSlug = `${baseSlug}-${Date.now().toString(36).slice(-5)}`;

  // On retire les champs qu'on ne doit pas copier
  const {
    id: _id,
    slug: _slug,
    created_at: _created,
    updated_at: _updated,
    published_at: _pub,
    views: _views,
    assigned_to: _assigned,
    ...rest
  } = source as Record<string, unknown>;
  void _id; void _slug; void _created; void _updated; void _pub; void _views; void _assigned;

  const { data: newJob, error: insertErr } = await supabase
    .from("jobs")
    .insert({
      ...rest,
      slug: newSlug,
      title: `${source.title} (copie)`,
      status: "draft",
      featured: false,
      assigned_to: null,
    })
    .select("id")
    .single();

  if (insertErr || !newJob) {
    return { ok: false, error: insertErr?.message ?? "Echec de la duplication" };
  }
  return { ok: true, id: newJob.id };
}
