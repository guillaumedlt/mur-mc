"use client";

import { useState } from "react";
import type { Job } from "@/lib/data";
import { createClient } from "@/lib/supabase/client";
import { TopBar } from "./top-bar";
import { CommandPalette } from "./command-palette";
import { Footer } from "./footer";

type Props = {
  jobs: Job[];
  count?: number;
  children: React.ReactNode;
};

/** Fetch published job count from Supabase once. */
function useJobCount(fallback: number): number {
  const [count, setCount] = useState(fallback);
  const [fetched, setFetched] = useState(fallback > 0);

  if (!fetched) {
    setFetched(true);
    const supabase = createClient();
    supabase
      .from("jobs")
      .select("id", { count: "exact", head: true })
      .eq("status", "published")
      .then(({ count: c }) => {
        if (typeof c === "number") setCount(c);
      });
  }

  return count;
}

/**
 * Shell partagé pour toutes les pages secondaires (entreprises, fiches…) :
 * outer padding crème + TopBar floating + command palette ⌘K.
 * Pas de sidebar de filtres : on n'en a besoin que sur le mur principal.
 */
export function Shell({ jobs, count, children }: Props) {
  const [query, setQuery] = useState("");
  const [paletteOpen, setPaletteOpen] = useState(false);
  const liveCount = useJobCount(count ?? jobs.length);

  return (
    <div className="min-h-screen bg-background p-3 flex flex-col">
      <TopBar
        count={liveCount}
        query={query}
        setQuery={setQuery}
        onOpenPalette={() => setPaletteOpen(true)}
      />
      <div className="mt-3 flex-1 min-h-0">{children}</div>
      <Footer />
      <CommandPalette
        jobs={jobs}
        open={paletteOpen}
        onClose={() => setPaletteOpen(false)}
      />
    </div>
  );
}
