"use client";

/**
 * Hook : loads applications from Supabase.
 * - Pass a jobId to get applications for a specific job (kanban).
 * - Pass null to get ALL applications for the user's company (pool).
 */

import { useState } from "react";
import { useUser } from "@/lib/auth";
import type {
  EmployerApplication,
  EmployerApplicationEvent,
  EmployerApplicationStatus,
  EmployerCandidate,
} from "@/lib/employer-store";
import { createClient } from "./client";

type UseMyApplicationsResult = {
  applications: EmployerApplication[];
  candidates: EmployerCandidate[];
  loading: boolean;
  refetch: () => void;
};

export function useMyApplications(jobId: string | null): UseMyApplicationsResult {
  const user = useUser();
  const [applications, setApplications] = useState<EmployerApplication[]>([]);
  const [candidates, setCandidates] = useState<EmployerCandidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchedFor, setFetchedFor] = useState<string | null>(null);

  const companyId = user?.companyId ?? null;
  const key = user ? `${jobId ?? "all"}:${user.id}` : null;

  const doFetch = async (jid: string | null) => {
    setLoading(true);
    const supabase = createClient();

    // Determine which job IDs to fetch for
    let jobIds: string[] = [];
    if (jid) {
      jobIds = [jid];
    } else if (companyId) {
      const { data: jobsData } = await supabase
        .from("jobs")
        .select("id")
        .eq("company_id", companyId);
      jobIds = (jobsData ?? []).map((j: { id: string }) => j.id);
      if (jobIds.length === 0) {
        setApplications([]);
        setCandidates([]);
        setLoading(false);
        return;
      }
    } else {
      setApplications([]);
      setCandidates([]);
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from("applications")
      .select(`
        *,
        application_events(*),
        candidate:profiles!applications_candidate_id_fkey(
          id, full_name, email, phone, location, headline, bio,
          experience_years, skills, languages, sectors,
          avatar_url, linkedin_url, cv_file_name
        )
      `)
      .in("job_id", jobIds)
      .order("order", { ascending: true });

    if (error || !data) {
      setLoading(false);
      return;
    }

    const apps: EmployerApplication[] = [];
    const cands: EmployerCandidate[] = [];
    const seenCandidates = new Set<string>();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    for (const row of data as any[]) {
      const rawEvents = Array.isArray(row.application_events)
        ? row.application_events
        : [];
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const events: EmployerApplicationEvent[] = rawEvents.map((e: any) => ({
        id: e.id,
        type: e.type,
        at: e.created_at,
        text: e.text ?? undefined,
        by: e.by_name ?? undefined,
        from: e.from_status ?? undefined,
        to: e.to_status ?? undefined,
      }));

      apps.push({
        id: row.id,
        jobId: row.job_id,
        candidateId: row.candidate_id,
        status: (row.status as EmployerApplicationStatus) ?? "received",
        matchScore: row.match_score ?? 0,
        rating: row.rating ?? 0,
        appliedAt: row.applied_at,
        updatedAt: row.updated_at,
        coverLetter: row.cover_letter ?? undefined,
        events,
        order: row.order ?? 0,
      });

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const c = row.candidate as any;
      if (c && !seenCandidates.has(c.id)) {
        seenCandidates.add(c.id);
        const nameParts = (c.full_name ?? "").split(/\s+/).filter(Boolean);
        const initials =
          nameParts.length >= 2
            ? `${nameParts[0][0]}${nameParts[nameParts.length - 1][0]}`.toUpperCase()
            : (c.full_name ?? "??").slice(0, 2).toUpperCase();

        cands.push({
          id: c.id,
          fullName: c.full_name ?? "",
          email: c.email ?? "",
          phone: c.phone ?? undefined,
          location: c.location ?? undefined,
          headline: c.headline ?? undefined,
          bio: c.bio ?? undefined,
          experienceYears: c.experience_years ?? undefined,
          skills: c.skills ?? [],
          languages: c.languages ?? [],
          sectors: c.sectors ?? [],
          avatarColor: "#1C3D5A",
          initials,
          linkedinUrl: c.linkedin_url ?? undefined,
          cvFileName: c.cv_file_name ?? undefined,
          source: "platform",
        });
      }
    }

    setApplications(apps);
    setCandidates(cands);
    setLoading(false);
  };

  if (key !== fetchedFor) {
    setFetchedFor(key);
    if (!user) {
      setApplications([]);
      setCandidates([]);
      setLoading(false);
    } else {
      doFetch(jobId);
    }
  }

  const refetch = () => {
    if (user) doFetch(jobId);
  };

  return { applications, candidates, loading, refetch };
}

/**
 * Move an application to a new status in Supabase.
 */
export async function moveApplicationSupabase(
  applicationId: string,
  toStatus: EmployerApplicationStatus,
  toIndex: number,
  fromStatus: EmployerApplicationStatus,
  byName: string,
): Promise<void> {
  const supabase = createClient();

  await supabase
    .from("applications")
    .update({ status: toStatus, order: toIndex })
    .eq("id", applicationId);

  if (fromStatus !== toStatus) {
    await supabase.from("application_events").insert({
      application_id: applicationId,
      type: "status_changed",
      from_status: fromStatus,
      to_status: toStatus,
      by_name: byName,
    });
  }
}

/**
 * Add an event to an application in Supabase.
 */
export async function addApplicationEventSupabase(
  applicationId: string,
  event: {
    type: string;
    text?: string;
    by?: string;
    from?: string;
    to?: string;
  },
): Promise<void> {
  const supabase = createClient();

  await supabase.from("application_events").insert({
    application_id: applicationId,
    type: event.type,
    text: event.text ?? null,
    by_name: event.by ?? null,
    from_status: event.from ?? null,
    to_status: event.to ?? null,
  });

  await supabase
    .from("applications")
    .update({ updated_at: new Date().toISOString() })
    .eq("id", applicationId);
}

/**
 * Rate an application in Supabase.
 */
export async function rateApplicationSupabase(
  applicationId: string,
  rating: number,
): Promise<void> {
  const supabase = createClient();
  await supabase
    .from("applications")
    .update({ rating: Math.max(0, Math.min(5, Math.round(rating))) })
    .eq("id", applicationId);
}
