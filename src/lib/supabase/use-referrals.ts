"use client";

import { useEffect, useState } from "react";
import { useUser } from "@/lib/auth";
import { createClient } from "./client";

export type Referral = {
  id: string;
  companyId: string;
  jobId: string | null;
  referrerName: string;
  token: string;
  candidateName?: string;
  candidateEmail?: string;
  status: "pending" | "applied" | "hired" | "expired";
  notes?: string;
  createdAt: string;
};

const EMPTY_REFERRALS: Referral[] = [];

export function useReferrals() {
  const user = useUser();
  const companyId = user?.companyId ?? null;
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [loading, setLoading] = useState(true);
  const [refetchTick, setRefetchTick] = useState(0);

  useEffect(() => {
    if (!companyId) return;
    let cancelled = false;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true);
    const supabase = createClient();
    supabase
      .from("referrals")
      .select("*")
      .eq("company_id", companyId)
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        if (cancelled) return;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const list = (data ?? []) as any[];
        setReferrals(
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          list.map((r: any) => ({
            id: r.id,
            companyId: r.company_id,
            jobId: r.job_id ?? null,
            referrerName: r.referrer_name ?? "",
            token: r.token ?? "",
            candidateName: r.candidate_name ?? undefined,
            candidateEmail: r.candidate_email ?? undefined,
            status: r.status ?? "pending",
            notes: r.notes ?? undefined,
            createdAt: r.created_at as string,
          })),
        );
        setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [companyId, refetchTick]);

  const refetch = () => setRefetchTick((t) => t + 1);

  if (!companyId) {
    return { referrals: EMPTY_REFERRALS, loading: false, refetch };
  }

  return { referrals, loading, refetch };
}

export async function createReferral(input: {
  companyId: string;
  jobId?: string;
  referrerId: string;
  referrerName: string;
  candidateName?: string;
  candidateEmail?: string;
  notes?: string;
}): Promise<Referral | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("referrals")
    .insert({
      company_id: input.companyId,
      job_id: input.jobId || null,
      referrer_id: input.referrerId,
      referrer_name: input.referrerName,
      candidate_name: input.candidateName || null,
      candidate_email: input.candidateEmail || null,
      notes: input.notes || null,
    })
    .select("*")
    .single();
  if (error || !data) return null;
  return {
    id: data.id,
    companyId: data.company_id,
    jobId: data.job_id,
    referrerName: data.referrer_name,
    token: data.token,
    candidateName: data.candidate_name ?? undefined,
    candidateEmail: data.candidate_email ?? undefined,
    status: data.status,
    notes: data.notes ?? undefined,
    createdAt: data.created_at,
  };
}
