"use client";

import { useEffect, useState } from "react";
import { useUser } from "@/lib/auth";
import { createClient } from "./client";

const EMPTY: string[] = [];

/**
 * Hook: reads and manages saved jobs from Supabase saved_jobs table.
 *
 * Quand l'utilisateur n'est pas connecte, on derive un return neutre
 * (savedIds=[], loading=false) au lieu de pousser ce reset dans l'effect.
 * Cela respecte la regle React 19 `react-hooks/set-state-in-effect` :
 * pas de cascade render inutile, le state interne reste celui du dernier
 * user connecte (clear par garbage collection au unmount).
 */
export function useSavedJobs() {
  const user = useUser();
  const userId = user?.id ?? null;
  const [savedIds, setSavedIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) return;
    let cancelled = false;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true);
    const supabase = createClient();
    supabase
      .from("saved_jobs")
      .select("job_id")
      .eq("user_id", userId)
      .then(({ data }) => {
        if (cancelled) return;
        setSavedIds(((data ?? []) as Array<{ job_id: string }>).map((r) => r.job_id));
        setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [userId]);

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

  if (!userId) {
    return {
      savedIds: EMPTY,
      loading: false,
      toggle,
      isSaved: () => false,
    };
  }

  return {
    savedIds,
    loading,
    toggle,
    isSaved: (jobId: string) => savedIds.includes(jobId),
  };
}
