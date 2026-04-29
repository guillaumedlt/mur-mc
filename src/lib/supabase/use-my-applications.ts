"use client";

/**
 * Hook : loads applications from Supabase.
 * - Pass a jobId to get applications for a specific job (kanban).
 * - Pass null to get ALL applications for the user's company (pool).
 */

import { useEffect, useState } from "react";
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

const EMPTY_APPS: EmployerApplication[] = [];
const EMPTY_CANDS: EmployerCandidate[] = [];

export function useMyApplications(jobId: string | null): UseMyApplicationsResult {
  const user = useUser();
  const companyId = user?.companyId ?? null;
  const userId = user?.id ?? null;
  const [applications, setApplications] = useState<EmployerApplication[]>([]);
  const [candidates, setCandidates] = useState<EmployerCandidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [refetchTick, setRefetchTick] = useState(0);

  useEffect(() => {
    if (!userId) return;

    let cancelled = false;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true);

    const run = async () => {
      const supabase = createClient();

      // Determine which job IDs to fetch for
      let jobIds: string[] = [];
      if (jobId) {
        jobIds = [jobId];
      } else if (companyId) {
        const { data: jobsData } = await supabase
          .from("jobs")
          .select("id")
          .eq("company_id", companyId);
        if (cancelled) return;
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

      if (cancelled) return;
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
          tags: row.tags ?? [],
          notes: row.notes ?? undefined,
          events,
          order: row.order ?? 0,
          rejectionReason: row.rejection_reason ?? undefined,
          rejectionNote: row.rejection_note ?? undefined,
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

      if (cancelled) return;
      setApplications(apps);
      setCandidates(cands);
      setLoading(false);
    };

    run();

    return () => {
      cancelled = true;
    };
  }, [companyId, userId, jobId, refetchTick]);

  const refetch = () => setRefetchTick((t) => t + 1);

  if (!userId) {
    return {
      applications: EMPTY_APPS,
      candidates: EMPTY_CANDS,
      loading: false,
      refetch,
    };
  }

  return { applications, candidates, loading, refetch };
}

/**
 * Move an application to a new status in Supabase.
 *
 * Si toStatus === "rejected" et qu'un reason/note est fourni, ils sont
 * persistes dans applications.rejection_reason / rejection_note.
 */
export async function moveApplicationSupabase(
  applicationId: string,
  toStatus: EmployerApplicationStatus,
  toIndex: number,
  fromStatus: EmployerApplicationStatus,
  byName: string,
  rejection?: { reason: string; note?: string },
): Promise<void> {
  const supabase = createClient();

  const patch: Record<string, unknown> = { status: toStatus, order: toIndex };
  if (toStatus === "rejected" && rejection?.reason) {
    patch.rejection_reason = rejection.reason;
    patch.rejection_note = rejection.note ?? null;
  } else if (toStatus !== "rejected") {
    // Si on sort de rejected, on efface le motif (ex: reopening)
    patch.rejection_reason = null;
    patch.rejection_note = null;
  }

  await supabase
    .from("applications")
    .update(patch)
    .eq("id", applicationId);

  if (fromStatus !== toStatus) {
    await supabase.from("application_events").insert({
      application_id: applicationId,
      type: "status_changed",
      from_status: fromStatus,
      to_status: toStatus,
      by_name: byName,
    });

    // Email notification to candidate
    const statusLabels: Record<string, string> = {
      shortlisted: "Pre-selectionne",
      reviewed: "CV consulte",
      interview: "Entretien planifie",
      offer: "Offre recue",
      hired: "Embauche",
      rejected: "Candidature non retenue",
    };
    const label = statusLabels[toStatus];
    if (label) {
      fetch("/api/notify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "statut_mis_a_jour",
          data: {
            applicationId,
            newStatus: toStatus,
            statusLabel: label,
          },
        }),
      }).catch(() => {});
    }
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
export async function updateApplicationSupabase(
  applicationId: string,
  patch: Record<string, unknown>,
): Promise<void> {
  const supabase = createClient();
  await supabase.from("applications").update(patch).eq("id", applicationId);
}

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
