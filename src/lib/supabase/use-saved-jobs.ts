"use client";

import { useState } from "react";
import { useUser } from "@/lib/auth";
import { createClient } from "./client";

/**
 * Hook: reads and manages saved jobs from Supabase saved_jobs table.
 */
export function useSavedJobs() {
  const user = useUser();
  const [savedIds, setSavedIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchedFor, setFetchedFor] = useState<string | null>(null);

  const userId = user?.id ?? null;
  if (userId !== fetchedFor) {
    setFetchedFor(userId);
    if (!userId) {
      setSavedIds([]);
      setLoading(false);
    } else {
      setLoading(true);
      const supabase = createClient();
      supabase
        .from("saved_jobs")
        .select("job_id")
        .eq("user_id", userId)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .then(({ data }: { data: any }) => {
          setSavedIds((data ?? []).map((r: { job_id: string }) => r.job_id));
          setLoading(false);
        });
    }
  }

  const toggle = async (jobId: string) => {
    if (!userId) return;
    const supabase = createClient();
    if (savedIds.includes(jobId)) {
      await supabase.from("saved_jobs").delete().eq("user_id", userId).eq("job_id", jobId);
      setSavedIds((prev) => prev.filter((id) => id !== jobId));
    } else {
      await supabase.from("saved_jobs").insert({ user_id: userId, job_id: jobId });
      setSavedIds((prev) => [...prev, jobId]);
    }
  };

  const isSaved = (jobId: string) => savedIds.includes(jobId);

  return { savedIds, loading, toggle, isSaved };
}
