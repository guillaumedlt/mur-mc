"use client";

import { useState } from "react";
import type { Job } from "@/lib/data";
import { TopBar } from "./top-bar";
import { CommandPalette } from "./command-palette";
import { Footer } from "./footer";

type Props = {
  jobs: Job[];
  count?: number;
  children: React.ReactNode;
};

/**
 * Shell partagé pour toutes les pages secondaires (entreprises, fiches…) :
 * outer padding crème + TopBar floating + command palette ⌘K.
 * Pas de sidebar de filtres : on n'en a besoin que sur le mur principal.
 */
export function Shell({ jobs, count, children }: Props) {
  const [query, setQuery] = useState("");
  const [paletteOpen, setPaletteOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background p-3 flex flex-col">
      <TopBar
        count={count ?? jobs.length}
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
