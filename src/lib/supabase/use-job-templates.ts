"use client";

import { useState } from "react";
import { useUser } from "@/lib/auth";
import { createClient } from "./client";

export type JobTemplate = {
  id: string;
  name: string;
  payload: Record<string, unknown>;
  createdAt: string;
};

/** Hook : charge les templates d'offres de la company du recruteur. */
export function useJobTemplates() {
  const user = useUser();
  const [templates, setTemplates] = useState<JobTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchedFor, setFetchedFor] = useState<string | null>(null);

  const companyId = user?.companyId ?? null;
  if (companyId !== fetchedFor) {
    setFetchedFor(companyId);
    if (!companyId) {
      setTemplates([]);
      setLoading(false);
    } else {
      setLoading(true);
      const supabase = createClient();
      supabase
        .from("job_templates")
        .select("id, name, payload, created_at")
        .eq("company_id", companyId)
        .order("created_at", { ascending: false })
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .then(({ data }: { data: any }) => {
          setTemplates(
            (data ?? []).map(
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              (r: any): JobTemplate => ({
                id: r.id,
                name: r.name,
                payload: r.payload ?? {},
                createdAt: r.created_at,
              }),
            ),
          );
          setLoading(false);
        });
    }
  }

  const refetch = () => setFetchedFor(null);
  return { templates, loading, refetch };
}

export async function saveJobTemplate(
  companyId: string,
  userId: string,
  name: string,
  payload: Record<string, unknown>,
): Promise<{ ok: boolean; error?: string; id?: string }> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("job_templates")
    .insert({ company_id: companyId, name, payload, created_by: userId })
    .select("id")
    .single();
  if (error) return { ok: false, error: error.message };
  return { ok: true, id: data?.id };
}

export async function deleteJobTemplate(id: string): Promise<void> {
  const supabase = createClient();
  await supabase.from("job_templates").delete().eq("id", id);
}
