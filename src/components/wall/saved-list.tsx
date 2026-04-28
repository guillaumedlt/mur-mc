"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Bookmark } from "iconoir-react";
import type { Job } from "@/lib/data";
import { useUser } from "@/lib/auth";
import { useSavedJobs } from "@/lib/supabase/use-saved-jobs";
import { JobCard } from "./job-card";

type Props = { jobs: Job[] };

export function SavedList({ jobs }: Props) {
  const user = useUser();
  const router = useRouter();
  const { savedIds, loading } = useSavedJobs();

  useEffect(() => {
    if (user === null) {
      const t = window.setTimeout(() => router.replace("/connexion"), 50);
      return () => window.clearTimeout(t);
    }
  }, [user, router]);

  if (!user || user.role !== "candidate") {
    return (
      <div className="max-w-[1100px] mx-auto bg-white border border-[var(--border)] rounded-2xl p-12 text-center">
        <p className="font-display italic text-[18px] text-foreground">
          Connecte-toi cote candidat pour voir tes sauvegardes.
        </p>
      </div>
    );
  }

  const savedJobs = jobs.filter((j) => savedIds.includes(j.id));

  return (
    <div className="max-w-[1100px] mx-auto">
      <Link
        href="/candidat"
        className="inline-flex items-center gap-1.5 text-[12.5px] text-foreground/55 hover:text-foreground transition-colors mb-3 px-1"
      >
        <ArrowLeft width={12} height={12} strokeWidth={2} />
        Mon espace candidat
      </Link>

      <header className="bg-white border border-[var(--border)] rounded-2xl px-5 sm:px-7 lg:px-9 py-6 lg:py-7 mb-3">
        <p className="ed-label-sm">Mises de cote</p>
        <h1 className="font-display text-[24px] sm:text-[26px] lg:text-[30px] tracking-[-0.015em] text-foreground mt-1">
          Mes offres sauvegardees
        </h1>
        <p className="text-[14px] text-muted-foreground mt-2 max-w-xl">
          {loading ? "Chargement..." : `${savedJobs.length} offre${savedJobs.length > 1 ? "s" : ""} sauvegardee${savedJobs.length > 1 ? "s" : ""}`}
        </p>
      </header>

      {savedJobs.length === 0 && !loading ? (
        <div className="bg-white border border-[var(--border)] rounded-2xl p-16 text-center">
          <Bookmark
            width={24}
            height={24}
            strokeWidth={1.6}
            className="text-foreground/35 inline-block"
          />
          <p className="font-display italic text-[18px] text-foreground mt-3">
            Aucune offre sauvegardee pour l&apos;instant.
          </p>
          <Link
            href="/"
            className="inline-flex h-10 mt-5 px-5 rounded-full bg-foreground text-background text-[13px] items-center"
          >
            Parcourir les offres
          </Link>
        </div>
      ) : (
        <div className="bg-white border border-[var(--border)] rounded-2xl px-7 py-6">
          <div className="wall-grid" data-density="standard">
            {savedJobs.map((j, i) => (
              <JobCard key={j.id} job={j} index={i} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
