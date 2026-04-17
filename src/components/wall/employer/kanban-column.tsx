"use client";

import type {
  EmployerApplication,
  EmployerApplicationStatus,
  EmployerCandidate,
} from "@/lib/employer-store";
import { statusLabel, statusTone } from "@/lib/employer-store";
import { KanbanCard } from "./kanban-card";

type DragState = {
  draggingId: string | null;
  overColumn: EmployerApplicationStatus | null;
  overIndex: number | null;
};

type Props = {
  status: EmployerApplicationStatus;
  items: EmployerApplication[];
  candidates: EmployerCandidate[];
  drag: DragState;
  onDragStart: (id: string) => void;
  onDragEnd: () => void;
  onDragOverColumn: (status: EmployerApplicationStatus) => void;
  onDragOverSlot: (status: EmployerApplicationStatus, index: number) => void;
  onDrop: (status: EmployerApplicationStatus, index: number) => void;
  isSelected?: (appId: string) => boolean;
  onToggleSelect?: (appId: string) => void;
};

export function KanbanColumn({
  status,
  items,
  candidates,
  drag,
  onDragStart,
  onDragEnd,
  onDragOverColumn,
  onDragOverSlot,
  onDrop,
  isSelected,
  onToggleSelect,
}: Props) {
  const isOver = drag.draggingId !== null && drag.overColumn === status;
  const count = items.length;
  // Quel index serait utilisé si on drop "dans la colonne" sans slot précis
  const fallbackIndex = drag.overIndex ?? items.length;

  return (
    <div
      className={`w-[280px] shrink-0 flex flex-col rounded-2xl border transition-colors ${
        isOver
          ? "border-[var(--accent)]/40 bg-[var(--accent)]/[0.03] ring-2 ring-[var(--accent)]/10"
          : "border-[var(--border)] bg-[var(--background-alt)]/40"
      }`}
      // La colonne entière est un drop target : si on survole n'importe où
      // dans la colonne (même en dehors des slots), on set overColumn.
      onDragOver={(e) => {
        e.preventDefault();
        onDragOverColumn(status);
      }}
      onDrop={(e) => {
        e.preventDefault();
        onDrop(status, fallbackIndex);
      }}
    >
      {/* Header */}
      <div className="px-3 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="wall-badge" data-tone={statusTone(status)}>
            {statusLabel(status)}
          </span>
          <span className="text-[11px] font-mono text-[var(--tertiary-foreground)] tabular-nums">
            {count}
          </span>
        </div>
      </div>

      {/* Cards + drop slots */}
      <ol className="flex-1 px-2 pb-2 flex flex-col gap-0 min-h-[80px]">
        {/* Drop slot avant la première card */}
        <DropSlot
          status={status}
          index={0}
          active={isOver && drag.overIndex === 0}
          onDragOver={onDragOverSlot}
          onDrop={onDrop}
        />

        {items.map((app, i) => {
          const cand = candidates.find((c) => c.id === app.candidateId);
          if (!cand) return null;
          return (
            <li key={app.id} className="list-none">
              <KanbanCard
                app={app}
                candidate={cand}
                isDragging={drag.draggingId === app.id}
                onDragStart={onDragStart}
                onDragEnd={onDragEnd}
                selected={isSelected?.(app.id)}
                onToggleSelect={onToggleSelect}
              />
              {/* Drop slot après chaque card */}
              <DropSlot
                status={status}
                index={i + 1}
                active={isOver && drag.overIndex === i + 1}
                onDragOver={onDragOverSlot}
                onDrop={onDrop}
              />
            </li>
          );
        })}

        {/* Zone vide cliquable si la colonne est vide */}
        {items.length === 0 && (
          <li className="list-none flex-1 flex items-center justify-center min-h-[60px]">
            <span className="text-[11px] text-[var(--tertiary-foreground)] italic">
              Glisser ici
            </span>
          </li>
        )}
      </ol>
    </div>
  );
}

function DropSlot({
  status,
  index,
  active,
  onDragOver,
  onDrop,
}: {
  status: EmployerApplicationStatus;
  index: number;
  active: boolean;
  onDragOver: (status: EmployerApplicationStatus, index: number) => void;
  onDrop: (status: EmployerApplicationStatus, index: number) => void;
}) {
  return (
    <li
      className={`list-none transition-all rounded-lg ${
        active
          ? "h-16 my-1.5 border-2 border-dashed border-[var(--accent)]/50 bg-[var(--accent)]/[0.06] flex items-center justify-center"
          : "h-1.5"
      }`}
      onDragOver={(e) => {
        e.preventDefault();
        e.stopPropagation();
        onDragOver(status, index);
      }}
      onDrop={(e) => {
        e.preventDefault();
        e.stopPropagation();
        onDrop(status, index);
      }}
    >
      {active && (
        <span className="text-[10.5px] text-[var(--accent)]/70 font-medium">
          Déposer ici
        </span>
      )}
    </li>
  );
}
