"use client";

import { useMemo, useState } from "react";
import {
  type EmployerApplication,
  type EmployerApplicationStatus,
  KANBAN_STATUSES,
} from "@/lib/employer-store";
import { moveApplicationSupabase, updateApplicationSupabase } from "@/lib/supabase/use-my-applications";
import { useMyApplications } from "@/lib/supabase/use-my-applications";
import { useManualCandidates, updateManualCandidateSupabase } from "@/lib/supabase/use-manual-candidates";
import { KanbanColumn } from "./kanban-column";
import { KanbanMobileTabs } from "./kanban-mobile-tabs";
import { RejectReasonModal, type RejectionReason } from "./reject-reason-modal";
import { KanbanBulkBar } from "./kanban-bulk-bar";
import { useKanbanSelection } from "./use-kanban-selection";

type Props = { jobId: string };

type PendingReject = {
  appId: string;
  fromStatus: EmployerApplicationStatus;
  toIndex: number;
  candidateName: string;
  isManual: boolean;
};

export function KanbanBoard({ jobId }: Props) {
  const { applications, candidates, refetch } = useMyApplications(jobId);
  const { candidates: manualCands, refetch: refetchManual } = useManualCandidates(jobId);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [overColumn, setOverColumn] =
    useState<EmployerApplicationStatus | null>(null);
  const [overIndex, setOverIndex] = useState<number | null>(null);
  const [pendingReject, setPendingReject] = useState<PendingReject | null>(null);
  const [bulkRejectOpen, setBulkRejectOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [sourceFilter, setSourceFilter] = useState<string>("all");
  const selection = useKanbanSelection();

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

  // Items filtres selon la recherche texte et le filtre source
  const filteredItems = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle && sourceFilter === "all") return allItems;
    return allItems.filter((app) => {
      const cand = allCandidates.find((c) => c.id === app.candidateId);
      if (sourceFilter !== "all" && cand?.source !== sourceFilter) return false;
      if (!needle) return true;
      const hay = `${cand?.fullName ?? ""} ${cand?.headline ?? ""} ${cand?.email ?? ""}`.toLowerCase();
      return hay.includes(needle);
    });
  }, [allItems, allCandidates, query, sourceFilter]);

  const byStatus = useMemo(() => {
    const out: Record<EmployerApplicationStatus, EmployerApplication[]> = {
      received: [], shortlisted: [], reviewed: [], interview: [], offer: [], hired: [], rejected: [],
    };
    for (const app of filteredItems) out[app.status].push(app);
    for (const k of Object.keys(out) as EmployerApplicationStatus[]) {
      out[k].sort((a, b) => a.order - b.order);
    }
    return out;
  }, [filteredItems]);

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

  const resolveCandidateName = (appId: string, isManual: boolean): string => {
    const candId = isManual
      ? appId.slice(3)
      : applications.find((a) => a.id === appId)?.candidateId;
    return allCandidates.find((c) => c.id === candId)?.fullName ?? "Candidat";
  };

  const onDrop = async (
    status: EmployerApplicationStatus,
    index: number,
  ) => {
    if (!draggingId) {
      onDragEnd();
      return;
    }
    const isManual = draggingId.startsWith("mc-");
    const fromStatus: EmployerApplicationStatus | undefined = isManual
      ? (manualCands.find((m) => m.id === draggingId.slice(3))?.status as EmployerApplicationStatus)
      : applications.find((a) => a.id === draggingId)?.status;

    // Passage vers rejected = demander le motif avant d'executer
    if (status === "rejected" && fromStatus !== "rejected") {
      setPendingReject({
        appId: draggingId,
        fromStatus: fromStatus ?? "received",
        toIndex: index,
        candidateName: resolveCandidateName(draggingId, isManual),
        isManual,
      });
      onDragEnd();
      return;
    }

    if (isManual) {
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
    onDragEnd();
  };

  const confirmReject = async (reason: RejectionReason, note: string) => {
    if (!pendingReject) return;
    const { appId, fromStatus, toIndex, isManual } = pendingReject;
    if (isManual) {
      const mcId = appId.slice(3);
      await updateManualCandidateSupabase(mcId, {
        status: "rejected",
        // Les manual candidates n'ont pas de table applications, on log dans notes
        notes: `Refus — ${reason}${note ? `\n${note}` : ""}`,
      });
      refetchManual();
    } else {
      await moveApplicationSupabase(appId, "rejected", toIndex, fromStatus, "", {
        reason,
        note,
      });
      refetch();
    }
    setPendingReject(null);
  };

  // ──── Actions bulk sur la selection ────
  const bulkMove = async (toStatus: EmployerApplicationStatus) => {
    const ids = Array.from(selection.ids);
    if (ids.length === 0) return;
    for (const id of ids) {
      if (id.startsWith("mc-")) {
        await updateManualCandidateSupabase(id.slice(3), { status: toStatus });
      } else {
        const app = applications.find((a) => a.id === id);
        if (app) {
          await moveApplicationSupabase(id, toStatus, 0, app.status, "");
        }
      }
    }
    selection.clear();
    refetch();
    refetchManual();
  };

  const bulkTag = async (tag: string) => {
    const ids = Array.from(selection.ids);
    if (ids.length === 0) return;
    for (const id of ids) {
      if (id.startsWith("mc-")) {
        const mcId = id.slice(3);
        const current = manualCands.find((m) => m.id === mcId);
        const newTags = Array.from(new Set([...(current?.tags ?? []), tag]));
        await updateManualCandidateSupabase(mcId, { tags: newTags });
      } else {
        const app = applications.find((a) => a.id === id);
        const newTags = Array.from(new Set([...(app?.tags ?? []), tag]));
        await updateApplicationSupabase(id, { tags: newTags });
      }
    }
    refetch();
    refetchManual();
  };

  const bulkReject = async (reason: RejectionReason, note: string) => {
    const ids = Array.from(selection.ids);
    if (ids.length === 0) return;
    for (const id of ids) {
      if (id.startsWith("mc-")) {
        await updateManualCandidateSupabase(id.slice(3), {
          status: "rejected",
          notes: `Refus — ${reason}${note ? `\n${note}` : ""}`,
        });
      } else {
        const app = applications.find((a) => a.id === id);
        if (app) {
          await moveApplicationSupabase(id, "rejected", 0, app.status, "", { reason, note });
        }
      }
    }
    selection.clear();
    setBulkRejectOpen(false);
    refetch();
    refetchManual();
  };

  const drag = { draggingId, overColumn, overIndex };

  return (
    <>
      {/* Filtres : recherche + source */}
      <div className="hidden lg:flex items-center gap-2 mb-3 flex-wrap">
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Rechercher un candidat..."
          className="h-9 px-3 rounded-full border border-[var(--border)] bg-white text-[12.5px] outline-none focus:border-[var(--accent)] w-64"
        />
        <select
          value={sourceFilter}
          onChange={(e) => setSourceFilter(e.target.value)}
          className="wall-select-pill"
          aria-label="Filtrer par source"
        >
          <option value="all">Toutes sources</option>
          <option value="platform">Mur.mc</option>
          <option value="manual">Ajout manuel</option>
          <option value="csv_import">Import CSV</option>
          <option value="referral">Cooptation</option>
        </select>
        {(query || sourceFilter !== "all") && (
          <button
            type="button"
            onClick={() => { setQuery(""); setSourceFilter("all"); }}
            className="text-[11.5px] text-foreground/55 hover:text-foreground underline underline-offset-2"
          >
            Reinitialiser
          </button>
        )}
        <span className="ml-auto text-[11px] text-[var(--tertiary-foreground)] tabular-nums">
          {filteredItems.length} candidat{filteredItems.length > 1 ? "s" : ""}
        </span>
      </div>

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
            isSelected={selection.has}
            onToggleSelect={selection.toggle}
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

      {pendingReject && (
        <RejectReasonModal
          candidateName={pendingReject.candidateName}
          onCancel={() => setPendingReject(null)}
          onConfirm={confirmReject}
        />
      )}

      {bulkRejectOpen && (
        <RejectReasonModal
          candidateName={`${selection.count} candidats`}
          onCancel={() => setBulkRejectOpen(false)}
          onConfirm={bulkReject}
        />
      )}

      <KanbanBulkBar
        count={selection.count}
        onMoveTo={bulkMove}
        onReject={() => setBulkRejectOpen(true)}
        onTag={bulkTag}
        onClear={selection.clear}
      />
    </>
  );
}
