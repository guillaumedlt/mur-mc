"use client";

import { useState } from "react";
import { useUser } from "@/lib/auth";
import { createClient } from "./client";

export type ManualCandidate = {
  id: string;
  companyId: string;
  jobId: string | null;
  fullName: string;
  email: string;
  phone?: string;
  location?: string;
  headline?: string;
  skills: string[];
  languages: string[];
  coverLetter?: string;
  status: string;
  rating: number;
  source: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  /** Computed */
  initials: string;
  avatarColor: string;
};

const PALETTE = ["#1C3D5A", "#7c1d2c", "#0a4d3a", "#062b3e", "#6B4423", "#5A2A2A", "#4A3D5A"];

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapCandidate(row: any, i: number): ManualCandidate {
  const name = row.full_name ?? "";
  const parts = name.split(/\s+/).filter(Boolean);
  const initials = parts.length >= 2
    ? `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase()
    : name.slice(0, 2).toUpperCase();

  return {
    id: row.id,
    companyId: row.company_id,
    jobId: row.job_id ?? null,
    fullName: name,
    email: row.email ?? "",
    phone: row.phone ?? undefined,
    location: row.location ?? undefined,
    headline: row.headline ?? undefined,
    skills: row.skills ?? [],
    languages: row.languages ?? [],
    coverLetter: row.cover_letter ?? undefined,
    status: row.status ?? "received",
    rating: row.rating ?? 0,
    source: row.source ?? "manual",
    notes: row.notes ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    initials,
    avatarColor: PALETTE[i % PALETTE.length],
  };
}

export function useManualCandidates(jobId?: string | null) {
  const user = useUser();
  const [candidates, setCandidates] = useState<ManualCandidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchedFor, setFetchedFor] = useState<string | null>(null);

  const companyId = user?.companyId ?? null;
  const key = companyId ? `${companyId}:${jobId ?? "all"}` : null;

  if (key !== fetchedFor) {
    setFetchedFor(key);
    if (!companyId) {
      setCandidates([]);
      setLoading(false);
    } else {
      setLoading(true);
      const supabase = createClient();
      let query = supabase
        .from("manual_candidates")
        .select("*")
        .eq("company_id", companyId)
        .order("created_at", { ascending: false });

      if (jobId) {
        query = query.eq("job_id", jobId);
      }

      query.then(({ data }) => {
        setCandidates((data ?? []).map(mapCandidate));
        setLoading(false);
      });
    }
  }

  const refetch = () => setFetchedFor(null);

  return { candidates, loading, refetch };
}

export async function addManualCandidateSupabase(input: {
  companyId: string;
  jobId?: string;
  fullName: string;
  email?: string;
  phone?: string;
  location?: string;
  headline?: string;
  skills?: string[];
  languages?: string[];
  coverLetter?: string;
  source?: string;
  addedBy: string;
}): Promise<ManualCandidate | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("manual_candidates")
    .insert({
      company_id: input.companyId,
      job_id: input.jobId || null,
      full_name: input.fullName,
      email: input.email || null,
      phone: input.phone || null,
      location: input.location || null,
      headline: input.headline || null,
      skills: input.skills ?? [],
      languages: input.languages ?? [],
      cover_letter: input.coverLetter || null,
      source: input.source ?? "manual",
      added_by: input.addedBy,
    })
    .select("*")
    .single();

  if (error) {
    window.console.error("Insert manual candidate error:", error);
    return null;
  }

  return data ? mapCandidate(data, 0) : null;
}

export async function updateManualCandidateSupabase(
  id: string,
  patch: Record<string, unknown>,
): Promise<void> {
  const supabase = createClient();
  await supabase.from("manual_candidates").update(patch).eq("id", id);
}

export async function deleteManualCandidateSupabase(id: string): Promise<void> {
  const supabase = createClient();
  await supabase.from("manual_candidates").delete().eq("id", id);
}
