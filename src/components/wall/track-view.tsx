"use client";

import { useEffect } from "react";

/**
 * Invisible component that records a unique job view on mount.
 * Fire-and-forget — no UI, no loading state.
 */
export function TrackView({ jobId }: { jobId: string }) {
  useEffect(() => {
    // Small delay to avoid counting bot pre-renders / quick bounces
    const t = window.setTimeout(() => {
      fetch("/api/view", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jobId }),
      }).catch(() => {});
    }, 1500);

    return () => window.clearTimeout(t);
  }, [jobId]);

  return null;
}
