"use client";

import { useState } from "react";
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

export function useReferrals() {
  const user = useUser();
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchedFor, setFetchedFor] = useState<string | null>(null);

  const companyId = user?.companyId ?? null;
  if (companyId !== fetchedFor) {
    setFetchedFor(companyId);
    if (!companyId) {
      setReferrals([]);
      setLoading(false);
    } else {
      setLoading(true);
      const supabase = createClient();
      supabase
        .from("referrals")
        .select("*")
        .eq("company_id", companyId)
        .order("created_at", { ascending: false })
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .then(({ data }: { data: any }) => {
          setReferrals(
            (data ?? []).map((r: Record<string, unknown>) => ({
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
    }
  }

  const refetch = () => setFetchedFor(null);
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
