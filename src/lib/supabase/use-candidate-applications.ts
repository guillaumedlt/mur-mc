"use client";

import { useEffect, useState } from "react";
import { useUser } from "@/lib/auth";
import { createClient } from "./client";

export type CandidateApplication = {
  id: string;
  jobId: string;
  jobTitle: string;
  jobSlug: string;
  companyName: string;
  companySlug: string;
  companyLogoColor: string;
  companyInitials: string;
  companyDomain?: string;
  companyLogoUrl?: string;
  status: string;
  matchScore: number;
  coverLetter?: string;
  appliedAt: string;
  events: Array<{
    id: string;
    type: string;
    text?: string;
    by?: string;
    createdAt: string;
  }>;
};

const EMPTY_CAND_APPS: CandidateApplication[] = [];

export function useCandidateApplications() {
  const user = useUser();
  const userId = user?.id ?? null;
  const [applications, setApplications] = useState<CandidateApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [refetchTick, setRefetchTick] = useState(0);

  useEffect(() => {
    if (!userId) return;
    let cancelled = false;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true);
    const supabase = createClient();
    supabase
      .from("applications")
      .select(`
        *,
        application_events(*),
        job:jobs!applications_job_id_fkey(
          id, slug, title,
          company:companies(name, slug, logo_color, initials, domain, logo_url)
        )
      `)
      .eq("candidate_id", userId)
      .order("applied_at", { ascending: false })
      .then(({ data }) => {
        if (cancelled) return;
        if (data) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const list = data as any[];
          setApplications(
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            list.map((row: any) => {
              const job = row.job;
              const company = job?.company;
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              const events = (row.application_events ?? []).map((e: any) => ({
                id: e.id,
                type: e.type,
                text: e.text ?? undefined,
                by: e.by_name ?? undefined,
                createdAt: e.created_at,
              }));
              return {
                id: row.id,
                jobId: row.job_id,
                jobTitle: job?.title ?? "Offre",
                jobSlug: job?.slug ?? "",
                companyName: company?.name ?? "Entreprise",
                companySlug: company?.slug ?? "",
                companyLogoColor: company?.logo_color ?? "#1C3D5A",
                companyInitials: company?.initials ?? "??",
                companyDomain: company?.domain ?? undefined,
                companyLogoUrl: company?.logo_url ?? undefined,
                status: row.status ?? "received",
                matchScore: row.match_score ?? 0,
                coverLetter: row.cover_letter ?? undefined,
                appliedAt: row.applied_at,
                events,
              };
            }),
          );
        }
        setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [userId, refetchTick]);

  const refetch = () => setRefetchTick((t) => t + 1);

  if (!userId) {
    return { applications: EMPTY_CAND_APPS, loading: false, refetch };
  }

  return { applications, loading, refetch };
}

export async function withdrawApplicationSupabase(
  appId: string,
): Promise<{ ok: boolean; error?: string }> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { ok: false, error: "Non authentifie" };
  }
  // RLS `applications_candidate` bloque deja cross-user en prod, mais on filtre
  // aussi explicitement ici en defense en profondeur — toute regression RLS
  // future serait sans effet sans ce filtre.
  const { error } = await supabase
    .from("applications")
    .delete()
    .eq("id", appId)
    .eq("candidate_id", user.id);
  if (error) {
    return { ok: false, error: error.message };
  }
  return { ok: true };
}
