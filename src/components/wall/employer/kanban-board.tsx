"use client";

import { useMemo, useState } from "react";
import {
  type EmployerApplicationStatus,
  KANBAN_STATUSES,
  applicationsByStatus,
  moveApplication,
  useEmployer,
} from "@/lib/employer-store";
import { KanbanColumn } from "./kanban-column";
import { KanbanMobileTabs } from "./kanban-mobile-tabs";

type Props = { jobId: string };

export function KanbanBoard({ jobId }: Props) {
  const { applications, candidates } = useEmployer();
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [overColumn, setOverColumn] =
    useState<EmployerApplicationStatus | null>(null);
  const [overIndex, setOverIndex] = useState<number | null>(null);

  // `applications` dans le dep array force le recalcul quand le store mute.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const byStatus = useMemo(() => applicationsByStatus(jobId), [jobId, applications]);

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

  const onDrop = (
    status: EmployerApplicationStatus,
    index: number,
  ) => {
    if (draggingId) {
      moveApplication(draggingId, status, index);
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
