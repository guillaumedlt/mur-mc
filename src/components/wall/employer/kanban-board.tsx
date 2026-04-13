"use client";

import { useMemo, useState } from "react";
import {
  type EmployerApplication,
  type EmployerApplicationStatus,
  KANBAN_STATUSES,
} from "@/lib/employer-store";
import { moveApplicationSupabase } from "@/lib/supabase/use-my-applications";
import { useMyApplications } from "@/lib/supabase/use-my-applications";
import { useManualCandidates, updateManualCandidateSupabase } from "@/lib/supabase/use-manual-candidates";
import { KanbanColumn } from "./kanban-column";
import { KanbanMobileTabs } from "./kanban-mobile-tabs";

type Props = { jobId: string };

export function KanbanBoard({ jobId }: Props) {
  const { applications, candidates, refetch } = useMyApplications(jobId);
  const { candidates: manualCands, refetch: refetchManual } = useManualCandidates(jobId);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [overColumn, setOverColumn] =
    useState<EmployerApplicationStatus | null>(null);
  const [overIndex, setOverIndex] = useState<number | null>(null);

  // Merge real applications + manual candidates into unified EmployerApplication[]
  const allItems = useMemo(() => {
    const items: EmployerApplication[] = [...applications];
    for (const mc of manualCands) {
      items.push({
        id: `mc-${mc.id}`,
        jobId: mc.jobId ?? jobId,
        candidateId: mc.id,
        status: mc.status as EmployerApplicationStatus,
        matchScore: 0,
        rating: mc.rating,
        appliedAt: mc.createdAt,
        updatedAt: mc.updatedAt,
        events: [],
        order: 999 + items.length,
      });
    }
    return items;
  }, [applications, manualCands, jobId]);

  // Also merge candidates list so kanban cards can resolve names
  const allCandidates = useMemo(() => {
    const merged = [...candidates];
    for (const mc of manualCands) {
      merged.push({
        id: mc.id,
        fullName: mc.fullName,
        email: mc.email,
        phone: mc.phone,
        location: mc.location,
        headline: mc.headline,
        skills: mc.skills,
        languages: mc.languages,
        sectors: [],
        avatarColor: mc.avatarColor,
        initials: mc.initials,
        source: mc.source as "manual" | "csv_import" | "referral" | "platform",
      });
    }
    return merged;
  }, [candidates, manualCands]);

  const byStatus = useMemo(() => {
    const out: Record<EmployerApplicationStatus, EmployerApplication[]> = {
      received: [], shortlisted: [], reviewed: [], interview: [], offer: [], hired: [], rejected: [],
    };
    for (const app of allItems) out[app.status].push(app);
    for (const k of Object.keys(out) as EmployerApplicationStatus[]) {
      out[k].sort((a, b) => a.order - b.order);
    }
    return out;
  }, [allItems]);

  const onDragStart = (id: string) => {
    setDraggingId(id);
  };

  const onDragEnd = () => {
    setDraggingId(null);
    setOverColumn(null);
    setOverIndex(null);
  };

  const onDragOverColumn = (status: EmployerApplicationStatus) => {
    if (overColumn !== status) {
      setOverColumn(status);
      // Quand on arrive sur une nouvelle colonne, reset l'index pour
      // que le drop par défaut ajoute en bas de la colonne.
      setOverIndex(null);
    }
  };

  const onDragOverSlot = (
    status: EmployerApplicationStatus,
    index: number,
  ) => {
    setOverColumn(status);
    setOverIndex(index);
  };

  const onDrop = async (
    status: EmployerApplicationStatus,
    index: number,
  ) => {
    if (draggingId) {
      if (draggingId.startsWith("mc-")) {
        // Manual candidate — update status in manual_candidates table
        const mcId = draggingId.slice(3);
        await updateManualCandidateSupabase(mcId, { status });
        refetchManual();
      } else {
        const app = applications.find((a) => a.id === draggingId);
        if (app) {
          await moveApplicationSupabase(draggingId, status, index, app.status, "");
          refetch();
        }
      }
    }
    onDragEnd();
  };

  const drag = { draggingId, overColumn, overIndex };

  return (
    <>
      {/* Desktop : vrai kanban horizontal */}
      <div className="hidden lg:flex gap-3 overflow-x-auto pb-3 wall-scroll">
        {KANBAN_STATUSES.map((status) => (
          <KanbanColumn
            key={status}
            status={status}
            items={byStatus[status]}
            candidates={allCandidates}
            drag={drag}
            onDragStart={onDragStart}
            onDragEnd={onDragEnd}
            onDragOverColumn={onDragOverColumn}
            onDragOverSlot={onDragOverSlot}
            onDrop={onDrop}
          />
        ))}
      </div>

      {/* Mobile : tabs + liste */}
      <div className="lg:hidden">
        <KanbanMobileTabs
          byStatus={byStatus}
          candidates={allCandidates}
          jobId={jobId}
        />
      </div>
    </>
  );
}
