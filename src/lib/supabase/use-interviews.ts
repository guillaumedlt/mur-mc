"use client";

import { useEffect, useState } from "react";
import { useUser } from "@/lib/auth";
import { createClient } from "./client";

export type Interview = {
  id: string;
  applicationId: string;
  jobId: string;
  candidateName: string;
  interviewerName?: string;
  type: "onsite" | "visio" | "phone";
  status: "scheduled" | "confirmed" | "completed" | "cancelled";
  scheduledAt: string;
  durationMinutes: number;
  location?: string;
  visioLink?: string;
  notes?: string;
  createdAt: string;
};

export type Scorecard = {
  id: string;
  applicationId: string;
  interviewerName: string;
  overallRating: number;
  recommendation?: string;
  notes?: string;
  criteria: Array<{ name: string; rating: number; comment?: string }>;
  createdAt: string;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapInterview(row: any): Interview {
  return {
    id: row.id,
    applicationId: row.application_id,
    jobId: row.job_id,
    candidateName: row.candidate_name,
    interviewerName: row.interviewer_name ?? undefined,
    type: row.type ?? "onsite",
    status: row.status ?? "scheduled",
    scheduledAt: row.scheduled_at,
    durationMinutes: row.duration_minutes ?? 45,
    location: row.location ?? undefined,
    visioLink: row.visio_link ?? undefined,
    notes: row.notes ?? undefined,
    createdAt: row.created_at,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapScorecard(row: any): Scorecard {
  return {
    id: row.id,
    applicationId: row.application_id,
    interviewerName: row.interviewer_name,
    overallRating: row.overall_rating ?? 0,
    recommendation: row.recommendation ?? undefined,
    notes: row.notes ?? undefined,
    criteria: Array.isArray(row.criteria) ? row.criteria : [],
    createdAt: row.created_at,
  };
}

const EMPTY_INTERVIEWS: Interview[] = [];
const EMPTY_SCORECARDS: Scorecard[] = [];

export function useInterviews(applicationId: string | null) {
  const user = useUser();
  const userId = user?.id ?? null;
  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [scorecards, setScorecards] = useState<Scorecard[]>([]);
  const [loading, setLoading] = useState(true);
  const [refetchTick, setRefetchTick] = useState(0);

  useEffect(() => {
    if (!applicationId || !userId) return;
    let cancelled = false;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true);
    const supabase = createClient();
    Promise.all([
      supabase.from("interviews").select("*").eq("application_id", applicationId).order("scheduled_at", { ascending: true }),
      supabase.from("interview_scorecards").select("*").eq("application_id", applicationId).order("created_at", { ascending: false }),
    ]).then(([intRes, scRes]) => {
      if (cancelled) return;
      setInterviews((intRes.data ?? []).map(mapInterview));
      setScorecards((scRes.data ?? []).map(mapScorecard));
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [applicationId, userId, refetchTick]);

  const refetch = () => setRefetchTick((t) => t + 1);

  if (!applicationId || !userId) {
    return {
      interviews: EMPTY_INTERVIEWS,
      scorecards: EMPTY_SCORECARDS,
      loading: false,
      refetch,
    };
  }

  return { interviews, scorecards, loading, refetch };
}

export async function scheduleInterview(input: {
  applicationId: string;
  jobId: string;
  candidateName: string;
  interviewerId?: string;
  interviewerName?: string;
  type: "onsite" | "visio" | "phone";
  scheduledAt: string;
  durationMinutes?: number;
  location?: string;
  visioLink?: string;
  notes?: string;
  createdBy: string;
}): Promise<Interview | null> {
  const supabase = createClient();
  const { data, error } = await supabase.from("interviews").insert({
    application_id: input.applicationId,
    job_id: input.jobId,
    candidate_name: input.candidateName,
    interviewer_id: input.interviewerId ?? null,
    interviewer_name: input.interviewerName ?? null,
    type: input.type,
    scheduled_at: input.scheduledAt,
    duration_minutes: input.durationMinutes ?? 45,
    location: input.location ?? null,
    visio_link: input.visioLink ?? null,
    notes: input.notes ?? null,
    created_by: input.createdBy,
  }).select("*").single();
  if (error) return null;
  return data ? mapInterview(data) : null;
}

export async function updateInterview(id: string, patch: Record<string, unknown>): Promise<void> {
  const supabase = createClient();
  await supabase.from("interviews").update(patch).eq("id", id);
}

export async function submitScorecard(input: {
  applicationId: string;
  interviewerId: string;
  interviewerName: string;
  overallRating: number;
  recommendation: string;
  notes?: string;
  criteria: Array<{ name: string; rating: number; comment?: string }>;
}): Promise<Scorecard | null> {
  const supabase = createClient();
  const { data, error } = await supabase.from("interview_scorecards").insert({
    application_id: input.applicationId,
    interviewer_id: input.interviewerId,
    interviewer_name: input.interviewerName,
    overall_rating: input.overallRating,
    recommendation: input.recommendation,
    notes: input.notes ?? null,
    criteria: input.criteria,
  }).select("*").single();
  if (error) return null;
  return data ? mapScorecard(data) : null;
}
