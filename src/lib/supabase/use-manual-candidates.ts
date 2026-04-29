"use client";

import { useEffect, useState } from "react";
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
  tags: string[];
  createdAt: string;
  updatedAt: string;
  /** Computed */
  initials: string;
  avatarColor: string;
};

export type CandidateEvent = {
  id: string;
  type: string;
  text?: string;
  fromStatus?: string;
  toStatus?: string;
  jobId?: string;
  createdAt: string;
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
    tags: row.tags ?? [],
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    initials,
    avatarColor: PALETTE[i % PALETTE.length],
  };
}

const EMPTY_MC: ManualCandidate[] = [];

export function useManualCandidates(jobId?: string | null) {
  const user = useUser();
  const companyId = user?.companyId ?? null;
  const [candidates, setCandidates] = useState<ManualCandidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [refetchTick, setRefetchTick] = useState(0);

  useEffect(() => {
    if (!companyId) return;
    let cancelled = false;
    // eslint-disable-next-line react-hooks/set-state-in-effect
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
      if (cancelled) return;
      setCandidates((data ?? []).map(mapCandidate));
      setLoading(false);
    });

    return () => {
      cancelled = true;
    };
  }, [companyId, jobId, refetchTick]);

  const refetch = () => setRefetchTick((t) => t + 1);

  if (!companyId) {
    return { candidates: EMPTY_MC, loading: false, refetch };
  }

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

/** Fetch events for a manual candidate. */
export async function fetchCandidateEvents(candidateId: string): Promise<CandidateEvent[]> {
  const supabase = createClient();
  const { data } = await supabase
    .from("candidate_events")
    .select("*")
    .eq("candidate_id", candidateId)
    .order("created_at", { ascending: false });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (data ?? []).map((e: any) => ({
    id: e.id,
    type: e.type,
    text: e.text ?? undefined,
    fromStatus: e.from_status ?? undefined,
    toStatus: e.to_status ?? undefined,
    jobId: e.job_id ?? undefined,
    createdAt: e.created_at,
  }));
}

/** Add an event to a manual candidate's timeline. */
export async function addCandidateEvent(input: {
  candidateId: string;
  type: string;
  text?: string;
  fromStatus?: string;
  toStatus?: string;
  jobId?: string;
  createdBy: string;
}): Promise<void> {
  const supabase = createClient();
  await supabase.from("candidate_events").insert({
    candidate_id: input.candidateId,
    type: input.type,
    text: input.text ?? null,
    from_status: input.fromStatus ?? null,
    to_status: input.toStatus ?? null,
    job_id: input.jobId ?? null,
    created_by: input.createdBy,
  });
}

/** Duplicate a candidate for a different job (propose for new offer). */
export async function duplicateCandidateForJob(
  candidateId: string,
  newJobId: string,
  companyId: string,
  addedBy: string,
): Promise<ManualCandidate | null> {
  const supabase = createClient();
  const { data: original } = await supabase
    .from("manual_candidates")
    .select("*")
    .eq("id", candidateId)
    .single();

  if (!original) return null;

  const { data, error } = await supabase
    .from("manual_candidates")
    .insert({
      company_id: companyId,
      job_id: newJobId,
      full_name: original.full_name,
      email: original.email,
      phone: original.phone,
      location: original.location,
      headline: original.headline,
      skills: original.skills,
      languages: original.languages,
      tags: original.tags,
      source: "referral",
      added_by: addedBy,
      status: "received",
    })
    .select("*")
    .single();

  if (error) return null;
  return data ? mapCandidate(data, 0) : null;
}

/** Reset a candidate back to the talent pool (remove job link, reset status). */
export async function resetToPool(candidateId: string): Promise<void> {
  const supabase = createClient();
  await supabase
    .from("manual_candidates")
    .update({ job_id: null, status: "received" })
    .eq("id", candidateId);
}
