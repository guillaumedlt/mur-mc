"use client";

import Link from "next/link";
import { ArrowLeft, Group } from "iconoir-react";
import { applicationsForJob, useEmployer } from "@/lib/employer-store";
import { KanbanBoard } from "./kanban-board";

type Props = { jobId: string };

export function KanbanPage({ jobId }: Props) {
  const { jobs } = useEmployer();
  const job = jobs.find((j) => j.id === jobId);
  const apps = applicationsForJob(jobId);

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

  return (
    <div className="max-w-[1400px] mx-auto">
      <Link
        href={`/recruteur/offres/${job.id}`}
        className="inline-flex items-center gap-1.5 text-[12.5px] text-foreground/55 hover:text-foreground transition-colors mb-3 px-1"
      >
        <ArrowLeft width={12} height={12} strokeWidth={2} />
        Retour à l&apos;offre
      </Link>

      <header className="bg-white border border-[var(--border)] rounded-2xl px-5 sm:px-7 lg:px-9 py-5 lg:py-6 mb-3">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="min-w-0">
            <p className="ed-label-sm">Pipeline candidats</p>
            <h1 className="font-display text-[22px] sm:text-[26px] lg:text-[28px] tracking-[-0.015em] text-foreground mt-1 line-clamp-1">
              {job.title}
            </h1>
          </div>
          <span className="wall-badge" data-tone="accent">
            <Group /> {apps.length} candidature{apps.length > 1 ? "s" : ""}
          </span>
        </div>
      </header>

      <KanbanBoard jobId={jobId} />
    </div>
  );
}
