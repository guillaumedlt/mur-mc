"use client";

import { useMemo, useState } from "react";
import {
  type EmployerApplication,
  type EmployerApplicationStatus,
  KANBAN_STATUSES,
} from "@/lib/employer-store";
import { moveApplicationSupabase } from "@/lib/supabase/use-my-applications";
import { useMyApplications } from "@/lib/supabase/use-my-applications";
import { KanbanColumn } from "./kanban-column";
import { KanbanMobileTabs } from "./kanban-mobile-tabs";

type Props = { jobId: string };

export function KanbanBoard({ jobId }: Props) {
  const { applications, candidates, refetch } = useMyApplications(jobId);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [overColumn, setOverColumn] =
    useState<EmployerApplicationStatus | null>(null);
  const [overIndex, setOverIndex] = useState<number | null>(null);

  const byStatus = useMemo(() => {
    const out: Record<EmployerApplicationStatus, EmployerApplication[]> = {
      received: [], reviewed: [], interview: [], offer: [], hired: [], rejected: [],
    };
    for (const app of applications) out[app.status].push(app);
    for (const k of Object.keys(out) as EmployerApplicationStatus[]) {
      out[k].sort((a, b) => a.order - b.order);
    }
    return out;
  }, [applications]);

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
      const app = applications.find((a) => a.id === draggingId);
      if (app) {
        await moveApplicationSupabase(draggingId, status, index, app.status, "");
        refetch();
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
            candidates={candidates}
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
          candidates={candidates}
          jobId={jobId}
        />
      </div>
    </>
  );
}
