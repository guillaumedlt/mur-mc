"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Group, Sparks } from "iconoir-react";
import { useMyJob, type MyJob } from "@/lib/supabase/use-my-jobs";
import { useMyApplications } from "@/lib/supabase/use-my-applications";
import { useManualCandidates, updateManualCandidateSupabase } from "@/lib/supabase/use-manual-candidates";
import { moveApplicationSupabase } from "@/lib/supabase/use-my-applications";
import type { EmployerCandidate } from "@/lib/employer-store";
import { KanbanBoard } from "./kanban-board";

/**
 * Score un candidat contre une offre (0-100).
 * Pas d'IA : compare skills, langues, headline vs requirements/tags/description.
 */
function scoreCandidate(
  candidate: { skills: string[]; languages: string[]; headline?: string; location?: string },
  job: MyJob,
): number {
  let score = 20; // base

  const jobText = [
    ...(job.requirements ?? []),
    ...(job.responsibilities ?? []),
    ...(job.tags ?? []),
    job.short_description ?? "",
    job.description ?? "",
    job.title ?? "",
  ]
    .join(" ")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

  // Skills match: +40 max
  if (candidate.skills.length > 0) {
    const matches = candidate.skills.filter((s) =>
      jobText.includes(s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")),
    ).length;
    const ratio = matches / Math.min(candidate.skills.length, 6);
    score += Math.round(ratio * 40);
  }

  // Languages match: +15
  const jobLangs = job.languages ?? [];
  if (jobLangs.length > 0 && candidate.languages.length > 0) {
    const overlap = jobLangs.filter((l) =>
      candidate.languages.some((cl) => cl.toLowerCase() === l.toLowerCase()),
    ).length;
    score += Math.round((overlap / jobLangs.length) * 15);
  }

  // Headline keywords vs title: +15
  if (candidate.headline) {
    const words = candidate.headline.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").split(/\s+/).filter((w) => w.length > 3);
    const titleLower = job.title.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    const matches = words.filter((w) => titleLower.includes(w)).length;
    if (matches > 0) score += Math.min(15, matches * 5);
  }

  // Location: +10
  if (candidate.location && job.location) {
    const cl = candidate.location.toLowerCase();
    const jl = job.location.toLowerCase();
    if (cl.includes("monaco") && jl.includes("monaco")) score += 10;
    else if (cl.includes(jl.split("—")[0].trim()) || jl.includes(cl.split("—")[0].trim())) score += 10;
  }

  return Math.max(0, Math.min(100, score));
}

type Props = { jobId: string };

export function KanbanPage({ jobId }: Props) {
  const { job, loading } = useMyJob(jobId);
  const { applications, candidates, refetch: refetchApps } = useMyApplications(jobId);
  const { candidates: manualCands, refetch: refetchManual } = useManualCandidates(jobId);
  const [sorting, setSorting] = useState(false);
  const [sortResult, setSortResult] = useState<{ qualified: number; rejected: number } | null>(null);

  if (loading) {
    return (
      <div className="max-w-[1100px] mx-auto bg-white border border-[var(--border)] rounded-2xl p-12 flex items-center justify-center">
        <span className="size-5 border-2 border-foreground/20 border-t-foreground rounded-full animate-spin" />
      </div>
    );
  }

  if (!job) {
    return (
      <div className="max-w-[1100px] mx-auto bg-white border border-[var(--border)] rounded-2xl p-12 text-center">
        <p className="font-display italic text-[18px] text-foreground">
          Cette offre n&apos;existe plus.
        </p>
        <Link
          href="/recruteur/offres"
          className="inline-flex h-10 mt-5 px-5 rounded-full bg-foreground text-background text-[13px] items-center"
        >
          Toutes mes offres
        </Link>
      </div>
    );
  }

  const THRESHOLD = 50; // score >= 50 = qualifie, < 50 = non retenu

  const autoSort = async () => {
    if (!job) return;
    setSorting(true);
    setSortResult(null);

    let qualified = 0;
    let rejected = 0;

    // Score real applications (only those in "received" status)
    for (const app of applications) {
      if (app.status !== "received") continue;
      const cand = candidates.find((c: EmployerCandidate) => c.id === app.candidateId);
      if (!cand) continue;
      const score = scoreCandidate(cand, job);
      if (score >= THRESHOLD) {
        await moveApplicationSupabase(app.id, "shortlisted", 0, "received", "Tri auto");
        qualified++;
      } else {
        await moveApplicationSupabase(app.id, "rejected", 0, "received", "Tri auto");
        rejected++;
      }
    }

    // Score manual candidates (only those in "received" status)
    for (const mc of manualCands) {
      if (mc.status !== "received") continue;
      const score = scoreCandidate(mc, job);
      if (score >= THRESHOLD) {
        await updateManualCandidateSupabase(mc.id, { status: "shortlisted" });
        qualified++;
      } else {
        await updateManualCandidateSupabase(mc.id, { status: "rejected" });
        rejected++;
      }
    }

    setSorting(false);
    setSortResult({ qualified, rejected });
    refetchApps();
    refetchManual();
  };

  const receivedCount = applications.filter((a) => a.status === "received").length
    + manualCands.filter((mc) => mc.status === "received").length;

  return (
    <div className="max-w-[1400px] mx-auto">
      <Link
        href={`/recruteur/offres/${job.id}`}
        className="inline-flex items-center gap-1.5 text-[12.5px] text-foreground/55 hover:text-foreground transition-colors mb-3 px-1"
      >
        <ArrowLeft width={12} height={12} strokeWidth={2} />
        Retour a l&apos;offre
      </Link>

      <header className="bg-white border border-[var(--border)] rounded-2xl px-5 sm:px-7 lg:px-9 py-5 lg:py-6 mb-3">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="min-w-0">
            <p className="ed-label-sm">Pipeline candidats</p>
            <h1 className="font-display text-[22px] sm:text-[26px] lg:text-[28px] tracking-[-0.015em] text-foreground mt-1 line-clamp-1">
              {job.title}
            </h1>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="wall-badge" data-tone="accent">
              <Group /> {applications.length + manualCands.length} candidat{(applications.length + manualCands.length) > 1 ? "s" : ""}
            </span>
            {receivedCount > 0 && (
              <button
                type="button"
                onClick={autoSort}
                disabled={sorting}
                className="h-9 px-4 rounded-full bg-[var(--accent)] text-background text-[12.5px] font-medium hover:bg-[var(--accent)]/85 disabled:opacity-50 transition-colors flex items-center gap-1.5 shrink-0"
              >
                {sorting ? (
                  <span className="size-3.5 border-2 border-background/30 border-t-background rounded-full animate-spin" />
                ) : (
                  <Sparks width={13} height={13} strokeWidth={2} />
                )}
                {sorting ? "Analyse..." : `Tri auto (${receivedCount} a trier)`}
              </button>
            )}
          </div>
        </div>

        {/* Sort result banner */}
        {sortResult && (
          <div className="mt-4 rounded-xl bg-[var(--accent)]/[0.06] border border-[var(--accent)]/20 px-4 py-3 flex items-center justify-between">
            <div className="text-[13px] text-foreground">
              <Sparks width={13} height={13} strokeWidth={2} className="inline -mt-0.5 mr-1.5 text-[var(--accent)]" />
              Tri termine : <strong>{sortResult.qualified}</strong> pre-selectionne{sortResult.qualified > 1 ? "s" : ""},
              <strong>{sortResult.rejected}</strong> non retenu{sortResult.rejected > 1 ? "s" : ""} (→ Refuse)
            </div>
            <button
              type="button"
              onClick={() => setSortResult(null)}
              className="text-[11px] text-foreground/50 hover:text-foreground transition-colors"
            >
              Fermer
            </button>
          </div>
        )}
      </header>

      <KanbanBoard jobId={jobId} />
    </div>
  );
}
