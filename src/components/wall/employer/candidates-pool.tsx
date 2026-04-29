"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Group,
  PlusCircle,
  Search,
  Settings,
  SortDown,
  SortUp,
  Trash,
  Upload,
  Xmark,
} from "iconoir-react";
import {
  type ColumnDef,
  type ColumnOrderState,
  type ColumnSizingState,
  type SortingState,
  type VisibilityState,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import {
  DndContext,
  type DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  horizontalListSortingStrategy,
  sortableKeyboardCoordinates,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  type EmployerApplicationStatus,
  KANBAN_STATUSES,
  candidateSourceLabel,
  statusLabel,
} from "@/lib/employer-store";
import { useMyJobs } from "@/lib/supabase/use-my-jobs";
import {
  moveApplicationSupabase,
  useMyApplications,
} from "@/lib/supabase/use-my-applications";
import {
  deleteManualCandidateSupabase,
  updateManualCandidateSupabase,
  useManualCandidates,
} from "@/lib/supabase/use-manual-candidates";
import { ApplicationStatusPill } from "./status-pill";
import { StarRatingCompact } from "./star-rating";
import { EmployerEmptyState } from "./employer-empty-state";

const STORAGE_KEY = "mcw-pool-table-v2";

// ─── Types ─────────────────────────────────────────────────

type CandidateRow = {
  id: string;
  fullName: string;
  email: string;
  headline?: string;
  initials: string;
  avatarColor: string;
  status: EmployerApplicationStatus;
  matchScore: number;
  rating: number;
  appliedAt: string;
  jobId: string;
  jobTitle: string | null;
  source: string;
  tags: string[];
  notes?: string;
  isManual: boolean;
};

type PersistedTableState = {
  columnOrder?: ColumnOrderState;
  columnVisibility?: VisibilityState;
  columnSizing?: ColumnSizingState;
};

// ─── Default column config ─────────────────────────────────

const DEFAULT_COLUMN_ORDER: string[] = [
  "select",
  "candidat",
  "status",
  "rating",
  "match",
  "tags",
  "offre",
  "source",
  "appliedAt",
  "actions",
];

// ─── Cell components ───────────────────────────────────────

function CandidatCell({ row }: { row: CandidateRow }) {
  return (
    <div className="flex items-center gap-2.5 min-w-0">
      <span
        className="size-9 rounded-lg flex items-center justify-center text-white font-display text-[12px] font-medium ring-1 ring-black/5 shrink-0"
        style={{ background: `linear-gradient(155deg, ${row.avatarColor}, #122a3f)` }}
        aria-hidden
      >
        {row.initials}
      </span>
      <div className="min-w-0 flex-1">
        <div className="text-[13px] font-medium text-foreground truncate">
          {row.fullName}
        </div>
        {row.headline && (
          <div className="text-[11.5px] text-muted-foreground truncate">
            {row.headline}
          </div>
        )}
      </div>
    </div>
  );
}

function TagsCell({ tags }: { tags: string[] }) {
  if (tags.length === 0)
    return <span className="text-[11.5px] text-foreground/30">—</span>;
  return (
    <div className="flex flex-wrap gap-1">
      {tags.slice(0, 3).map((tag) => {
        const accent = tag === "Top profil" || tag === "Urgent";
        return (
          <span
            key={tag}
            className={`h-5 px-1.5 rounded-full text-[10px] inline-flex items-center ${
              accent
                ? "bg-[var(--accent)]/15 text-[var(--accent)] font-medium"
                : "bg-[var(--background-alt)] text-foreground/65 border border-[var(--border)]"
            }`}
          >
            {tag}
          </span>
        );
      })}
      {tags.length > 3 && (
        <span className="text-[10px] text-foreground/40 self-center">
          +{tags.length - 3}
        </span>
      )}
    </div>
  );
}

function MatchCell({ score }: { score: number }) {
  if (score === 0)
    return <span className="text-[11.5px] text-foreground/30">—</span>;
  const tone = score >= 80 ? "high" : score >= 60 ? "mid" : "low";
  const cls =
    tone === "high"
      ? "bg-emerald-50 text-emerald-700 border-emerald-200"
      : tone === "mid"
        ? "bg-amber-50 text-amber-700 border-amber-200"
        : "bg-foreground/5 text-foreground/60 border-[var(--border)]";
  return (
    <span
      className={`h-5 px-2 rounded-full text-[10.5px] font-mono tabular-nums font-medium border inline-flex items-center ${cls}`}
    >
      {score}%
    </span>
  );
}

function formatRelative(iso: string): string {
  const d = new Date(iso);
  const diff = Math.round((Date.now() - d.getTime()) / (1000 * 60 * 60 * 24));
  if (diff <= 0) return "auj.";
  if (diff === 1) return "hier";
  if (diff < 7) return `${diff}j`;
  if (diff < 30) return `${Math.round(diff / 7)}sem`;
  if (diff < 365) return `${Math.round(diff / 30)}mois`;
  return `${Math.round(diff / 365)}an`;
}

// ─── Column definitions ────────────────────────────────────

const COLUMNS: ColumnDef<CandidateRow>[] = [
  {
    id: "select",
    enableResizing: false,
    enableSorting: false,
    size: 40,
    header: ({ table }) => (
      <input
        type="checkbox"
        checked={table.getIsAllRowsSelected()}
        ref={(el) => {
          if (el) el.indeterminate = table.getIsSomeRowsSelected();
        }}
        onChange={table.getToggleAllRowsSelectedHandler()}
        onClick={(e) => e.stopPropagation()}
        aria-label="Tout selectionner"
        className="size-4 accent-foreground cursor-pointer"
      />
    ),
    cell: ({ row }) => (
      <input
        type="checkbox"
        checked={row.getIsSelected()}
        onChange={row.getToggleSelectedHandler()}
        onClick={(e) => e.stopPropagation()}
        aria-label="Selectionner"
        className="size-4 accent-foreground cursor-pointer"
      />
    ),
  },
  {
    id: "candidat",
    accessorKey: "fullName",
    header: "Candidat",
    size: 280,
    minSize: 180,
    cell: ({ row }) => <CandidatCell row={row.original} />,
  },
  {
    id: "status",
    accessorKey: "status",
    header: "Statut",
    size: 130,
    minSize: 100,
    cell: ({ row }) => <ApplicationStatusPill status={row.original.status} />,
  },
  {
    id: "rating",
    accessorKey: "rating",
    header: "Note",
    size: 110,
    minSize: 90,
    cell: ({ row }) =>
      row.original.rating > 0 ? (
        <StarRatingCompact value={row.original.rating} />
      ) : (
        <span className="text-[11.5px] text-foreground/30">—</span>
      ),
  },
  {
    id: "match",
    accessorKey: "matchScore",
    header: "Match",
    size: 90,
    minSize: 70,
    cell: ({ row }) => <MatchCell score={row.original.matchScore} />,
  },
  {
    id: "tags",
    accessorFn: (r) => r.tags.join(" "),
    header: "Tags",
    enableSorting: false,
    size: 220,
    minSize: 120,
    cell: ({ row }) => <TagsCell tags={row.original.tags} />,
  },
  {
    id: "offre",
    accessorFn: (r) => r.jobTitle ?? "",
    header: "Offre",
    size: 200,
    minSize: 120,
    cell: ({ row }) =>
      row.original.jobTitle ? (
        <span className="text-[12.5px] text-foreground/75 truncate">
          {row.original.jobTitle}
        </span>
      ) : (
        <span className="text-[11px] text-[var(--accent)]/80 font-medium">
          Vivier
        </span>
      ),
  },
  {
    id: "source",
    accessorKey: "source",
    header: "Source",
    size: 110,
    minSize: 90,
    cell: ({ row }) => {
      const src = row.original.source as Parameters<typeof candidateSourceLabel>[0];
      return (
        <span className="text-[11.5px] text-foreground/55 capitalize">
          {candidateSourceLabel(src)}
        </span>
      );
    },
  },
  {
    id: "appliedAt",
    accessorKey: "appliedAt",
    header: "Date",
    size: 90,
    minSize: 70,
    cell: ({ row }) => (
      <span className="text-[11.5px] font-mono tabular-nums text-foreground/55">
        {formatRelative(row.original.appliedAt)}
      </span>
    ),
  },
  {
    id: "actions",
    enableResizing: false,
    enableSorting: false,
    size: 50,
    header: "",
    cell: ({ row }) => (
      <Link
        href={`/recruteur/candidats/${row.original.id}`}
        onClick={(e) => e.stopPropagation()}
        className="text-[12px] text-[var(--accent)] hover:underline underline-offset-2"
      >
        Ouvrir
      </Link>
    ),
  },
];

// ─── Draggable header ──────────────────────────────────────

const NON_DRAGGABLE = new Set(["select", "actions"]);

type DraggableHeaderProps = {
  id: string;
  isDraggable: boolean;
  width: number;
  canSort: boolean;
  sortDir: false | "asc" | "desc";
  canResize: boolean;
  onSortClick: () => void;
  onResizeMouseDown: React.MouseEventHandler;
  onResizeTouchStart: React.TouchEventHandler;
  isResizing: boolean;
  children: React.ReactNode;
};

function DraggableHeader({
  id,
  isDraggable,
  width,
  canSort,
  sortDir,
  canResize,
  onSortClick,
  onResizeMouseDown,
  onResizeTouchStart,
  isResizing,
  children,
}: DraggableHeaderProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id, disabled: !isDraggable });

  const style: React.CSSProperties = {
    width,
    minWidth: width,
    maxWidth: width,
    transform: CSS.Translate.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
    position: "relative",
    zIndex: isDragging ? 2 : undefined,
  };

  return (
    <th
      ref={setNodeRef}
      style={style}
      className="bg-[var(--background-alt)]/80 backdrop-blur-sm border-b border-[var(--border)] text-left text-[10.5px] uppercase tracking-[0.06em] font-semibold text-foreground/55 select-none"
    >
      <div
        className={`flex items-center gap-1.5 px-3 h-9 ${
          isDraggable ? "cursor-grab active:cursor-grabbing" : ""
        }`}
        {...(isDraggable ? attributes : {})}
        {...(isDraggable ? listeners : {})}
      >
        {canSort ? (
          <button
            type="button"
            onPointerDown={(e) => e.stopPropagation()}
            onClick={(e) => {
              e.stopPropagation();
              onSortClick();
            }}
            className="flex items-center gap-1 hover:text-foreground transition-colors"
          >
            {children}
            {sortDir === "asc" && (
              <SortUp width={11} height={11} strokeWidth={2.2} />
            )}
            {sortDir === "desc" && (
              <SortDown width={11} height={11} strokeWidth={2.2} />
            )}
          </button>
        ) : (
          <span>{children}</span>
        )}
      </div>
      {canResize && (
        <div
          onMouseDown={onResizeMouseDown}
          onTouchStart={onResizeTouchStart}
          onPointerDown={(e) => e.stopPropagation()}
          onClick={(e) => e.stopPropagation()}
          className={`absolute right-0 top-0 h-full w-1.5 cursor-col-resize touch-none select-none ${
            isResizing ? "bg-[var(--accent)]" : "bg-transparent hover:bg-foreground/15"
          }`}
        />
      )}
    </th>
  );
}

// ─── Main ──────────────────────────────────────────────────

export function CandidatesPool() {
  const router = useRouter();
  const { jobs } = useMyJobs();
  const { applications, candidates, refetch: refetchApps } =
    useMyApplications(null);
  const { candidates: manualCands, refetch: refetchManual } =
    useManualCandidates();

  // ── Build unified data ──
  const allRows: CandidateRow[] = useMemo(() => {
    const rows: CandidateRow[] = [];
    for (const app of applications) {
      const cand = candidates.find((c) => c.id === app.candidateId);
      const job = jobs.find((j) => j.id === app.jobId);
      rows.push({
        id: app.id,
        fullName: cand?.fullName ?? "Candidat",
        email: cand?.email ?? "",
        headline: cand?.headline,
        initials: cand?.initials ?? "??",
        avatarColor: cand?.avatarColor ?? "#1C3D5A",
        status: app.status,
        matchScore: app.matchScore,
        rating: app.rating,
        appliedAt: app.appliedAt,
        jobId: app.jobId,
        jobTitle: job?.title ?? null,
        source: "platform",
        tags: app.tags ?? [],
        notes: app.notes ?? undefined,
        isManual: false,
      });
    }
    for (const mc of manualCands) {
      const job = jobs.find((j) => j.id === mc.jobId);
      rows.push({
        id: `mc-${mc.id}`,
        fullName: mc.fullName,
        email: mc.email,
        headline: mc.headline,
        initials: mc.initials,
        avatarColor: mc.avatarColor,
        status: mc.status as EmployerApplicationStatus,
        matchScore: 0,
        rating: mc.rating,
        appliedAt: mc.createdAt,
        jobId: mc.jobId ?? "",
        jobTitle: job?.title ?? null,
        source: mc.source,
        tags: mc.tags ?? [],
        notes: mc.notes,
        isManual: true,
      });
    }
    return rows;
  }, [applications, candidates, manualCands, jobs]);

  // ── Filters (kept above the table for visibility) ──
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<
    EmployerApplicationStatus | "all"
  >("all");
  const [jobFilter, setJobFilter] = useState<string>("all");
  const [tagFilter, setTagFilter] = useState<string>("all");
  const [ratingFilter, setRatingFilter] = useState<number>(0);
  const [vivierOnly, setVivierOnly] = useState(false);

  const allTags = useMemo(() => {
    const tags = new Set<string>();
    for (const r of allRows) for (const t of r.tags) tags.add(t);
    return Array.from(tags).sort();
  }, [allRows]);

  const filteredData = useMemo(() => {
    const q = query.trim().toLowerCase();
    let list = allRows;
    if (statusFilter !== "all") list = list.filter((r) => r.status === statusFilter);
    if (jobFilter !== "all") list = list.filter((r) => r.jobId === jobFilter);
    if (tagFilter !== "all") list = list.filter((r) => r.tags.includes(tagFilter));
    if (ratingFilter > 0) list = list.filter((r) => r.rating >= ratingFilter);
    if (vivierOnly) list = list.filter((r) => !r.jobId);
    if (q) {
      list = list.filter((r) => {
        const hay =
          `${r.fullName} ${r.headline ?? ""} ${r.email} ${r.tags.join(" ")} ${r.notes ?? ""}`.toLowerCase();
        return hay.includes(q);
      });
    }
    return list;
  }, [allRows, query, statusFilter, jobFilter, tagFilter, ratingFilter, vivierOnly]);

  // ── Table state (persisted) ──
  const [columnOrder, setColumnOrder] =
    useState<ColumnOrderState>(DEFAULT_COLUMN_ORDER);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [columnSizing, setColumnSizing] = useState<ColumnSizingState>({});
  const [sorting, setSorting] = useState<SortingState>([
    { id: "appliedAt", desc: true },
  ]);
  const [rowSelection, setRowSelection] = useState<Record<string, boolean>>({});
  const [columnsMenuOpen, setColumnsMenuOpen] = useState(false);

  // Hydrate from localStorage (mount only)
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as PersistedTableState;
      if (Array.isArray(parsed.columnOrder) && parsed.columnOrder.length > 0) {
        // Patch : ajouter les nouvelles colonnes potentiellement manquantes
        const missing = DEFAULT_COLUMN_ORDER.filter(
          (id) => !parsed.columnOrder!.includes(id),
        );
        setColumnOrder([...parsed.columnOrder, ...missing]);
      }
      if (parsed.columnVisibility) setColumnVisibility(parsed.columnVisibility);
      if (parsed.columnSizing) setColumnSizing(parsed.columnSizing);
    } catch {
      // ignore, default state
    }
  }, []);

  // Persist on change
  useEffect(() => {
    try {
      window.localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ columnOrder, columnVisibility, columnSizing }),
      );
    } catch {
      // quota exceeded etc — silent
    }
  }, [columnOrder, columnVisibility, columnSizing]);

  // ── Table instance ──
  const table = useReactTable({
    data: filteredData,
    columns: COLUMNS,
    state: { columnOrder, columnVisibility, columnSizing, sorting, rowSelection },
    getRowId: (row) => row.id,
    onColumnOrderChange: setColumnOrder,
    onColumnVisibilityChange: setColumnVisibility,
    onColumnSizingChange: setColumnSizing,
    onSortingChange: setSorting,
    onRowSelectionChange: setRowSelection,
    enableColumnResizing: true,
    columnResizeMode: "onChange",
    enableRowSelection: true,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  // ── DnD ──
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const activeId = String(active.id);
    const overId = String(over.id);
    setColumnOrder((prev) => {
      const oldIndex = prev.indexOf(activeId);
      const newIndex = prev.indexOf(overId);
      if (oldIndex === -1 || newIndex === -1) return prev;
      return arrayMove(prev, oldIndex, newIndex);
    });
  };

  const draggableIds = columnOrder.filter((id) => !NON_DRAGGABLE.has(id));

  // ── Bulk actions ──
  const selectedIds = Object.keys(rowSelection).filter((k) => rowSelection[k]);
  const selectedRows = filteredData.filter((r) => rowSelection[r.id]);
  const selectedCount = selectedIds.length;

  const clearSelection = () => setRowSelection({});

  const bulkAddTag = async () => {
    const tag = window.prompt("Ajouter un tag aux candidats selectionnes :");
    if (!tag || !tag.trim()) return;
    const t = tag.trim();
    for (const row of selectedRows) {
      if (!row.isManual) continue;
      const mcId = row.id.replace(/^mc-/, "");
      const existing = manualCands.find((c) => c.id === mcId);
      if (!existing) continue;
      if ((existing.tags ?? []).includes(t)) continue;
      await updateManualCandidateSupabase(mcId, {
        tags: [...(existing.tags ?? []), t],
      });
    }
    refetchManual();
  };

  const bulkChangeStatus = async (status: EmployerApplicationStatus) => {
    for (const row of selectedRows) {
      if (row.isManual) {
        const mcId = row.id.replace(/^mc-/, "");
        await updateManualCandidateSupabase(mcId, { status });
      } else {
        await moveApplicationSupabase(row.id, status, 0, row.status, "");
      }
    }
    refetchApps();
    refetchManual();
    clearSelection();
  };

  const bulkDelete = async () => {
    const manualOnly = selectedRows.filter((r) => r.isManual);
    if (manualOnly.length === 0) {
      window.alert(
        "Seuls les candidats ajoutes manuellement peuvent etre supprimes.",
      );
      return;
    }
    if (
      !window.confirm(
        `Supprimer ${manualOnly.length} candidat${manualOnly.length > 1 ? "s" : ""} ? (Les candidatures via la plateforme ne peuvent pas etre supprimees.)`,
      )
    ) {
      return;
    }
    for (const row of manualOnly) {
      const mcId = row.id.replace(/^mc-/, "");
      await deleteManualCandidateSupabase(mcId);
    }
    clearSelection();
    refetchManual();
  };

  // ── Reset table preferences ──
  const resetTable = () => {
    setColumnOrder(DEFAULT_COLUMN_ORDER);
    setColumnVisibility({});
    setColumnSizing({});
    setSorting([{ id: "appliedAt", desc: true }]);
  };

  const allStatuses: Array<EmployerApplicationStatus | "all"> = [
    "all",
    ...KANBAN_STATUSES,
  ];

  return (
    <div className="max-w-[1280px] mx-auto">
      {/* ─── Header ────────────────────────────────────── */}
      <header className="bg-white border border-[var(--border)] rounded-2xl px-5 sm:px-7 lg:px-9 py-6 mb-3">
        <p className="ed-label-sm">Vivier de talents</p>
        <h1 className="font-display text-[24px] sm:text-[28px] lg:text-[30px] tracking-[-0.015em] text-foreground mt-1">
          Tous les candidats
        </h1>
        <p className="text-[13.5px] text-muted-foreground mt-2">
          {allRows.length} candidat{allRows.length > 1 ? "s" : ""} ·{" "}
          {manualCands.filter((mc) => !mc.jobId).length} dans le vivier ·{" "}
          {jobs.length} offre{jobs.length > 1 ? "s" : ""}
        </p>
        <div className="flex items-center gap-2 mt-4">
          <Link
            href="/recruteur/candidats/ajouter"
            className="h-9 px-3.5 rounded-full bg-foreground text-background text-[12.5px] font-medium hover:bg-foreground/85 transition-colors flex items-center gap-1.5"
          >
            <PlusCircle width={13} height={13} strokeWidth={2} />
            Ajouter un candidat
          </Link>
          <Link
            href="/recruteur/candidats/ajouter"
            className="h-9 px-3.5 rounded-full border border-[var(--border)] bg-white text-[12.5px] text-foreground/80 hover:text-foreground hover:bg-[var(--background-alt)] transition-colors flex items-center gap-1.5"
          >
            <Upload width={13} height={13} strokeWidth={2} />
            Import CSV
          </Link>
        </div>
      </header>

      {/* ─── Toolbar (search + filters chips + columns menu) ──── */}
      <div className="bg-white border border-[var(--border)] rounded-2xl px-4 py-3 mb-3 flex flex-col gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <div className="wall-input w-full sm:w-auto sm:min-w-[260px] sm:max-w-[360px]">
            <Search
              width={14}
              height={14}
              strokeWidth={2}
              className="text-[var(--tertiary-foreground)] shrink-0"
            />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Nom, competence, email..."
              className="flex-1 min-w-0 bg-transparent outline-none text-[13px] placeholder:text-[var(--tertiary-foreground)]"
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery("")}
                className="size-5 rounded-full hover:bg-foreground/10 flex items-center justify-center text-foreground/40 hover:text-foreground"
                aria-label="Effacer"
              >
                <Xmark width={11} height={11} strokeWidth={2.4} />
              </button>
            )}
          </div>

          <select
            value={jobFilter}
            onChange={(e) => setJobFilter(e.target.value)}
            className="wall-select-pill max-w-[220px] truncate"
            aria-label="Offre"
          >
            <option value="all">Toutes les offres</option>
            {jobs.map((j) => (
              <option key={j.id} value={j.id}>
                {j.title}
              </option>
            ))}
          </select>

          <label className="flex items-center gap-2 text-[12px] text-foreground/70 cursor-pointer select-none ml-1">
            <span className="wall-check" data-checked={vivierOnly} />
            <input
              type="checkbox"
              checked={vivierOnly}
              onChange={(e) => setVivierOnly(e.target.checked)}
              className="sr-only"
            />
            Vivier uniquement
          </label>

          {/* Right side */}
          <div className="ml-auto flex items-center gap-2 relative">
            <button
              type="button"
              onClick={() => setColumnsMenuOpen((v) => !v)}
              className="h-9 px-3 rounded-xl border border-[var(--border)] bg-white text-[12px] font-medium text-foreground/80 hover:border-foreground/30 inline-flex items-center gap-1.5"
            >
              <Settings width={12} height={12} strokeWidth={2} />
              Colonnes
            </button>
            {columnsMenuOpen && (
              <div
                className="absolute right-0 top-11 z-30 bg-white border border-[var(--border)] rounded-xl shadow-[0_12px_32px_-8px_rgba(10,10,10,0.18)] py-1.5 min-w-[200px]"
                onMouseLeave={() => setColumnsMenuOpen(false)}
              >
                {table
                  .getAllLeafColumns()
                  .filter((c) => c.id !== "select" && c.id !== "actions")
                  .map((col) => (
                    <label
                      key={col.id}
                      className="flex items-center gap-2 px-3 py-1.5 text-[12.5px] text-foreground/85 hover:bg-[var(--background-alt)] cursor-pointer mx-1 rounded-lg"
                    >
                      <input
                        type="checkbox"
                        checked={col.getIsVisible()}
                        onChange={col.getToggleVisibilityHandler()}
                        className="size-3.5 accent-foreground"
                      />
                      <span className="capitalize">
                        {typeof col.columnDef.header === "string"
                          ? col.columnDef.header
                          : col.id}
                      </span>
                    </label>
                  ))}
                <div className="border-t border-[var(--border)] mt-1 pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      resetTable();
                      setColumnsMenuOpen(false);
                    }}
                    className="w-full text-left px-3 py-1.5 text-[12px] text-foreground/65 hover:text-foreground hover:bg-[var(--background-alt)] rounded-lg mx-1"
                    style={{ width: "calc(100% - 8px)" }}
                  >
                    Reinitialiser le tableau
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Status chips */}
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-[10.5px] uppercase tracking-[0.08em] font-semibold text-foreground/40 mr-1">
            Statut
          </span>
          {allStatuses.map((s) => {
            const count =
              s === "all"
                ? allRows.length
                : allRows.filter((a) => a.status === s).length;
            const active = statusFilter === s;
            return (
              <button
                key={s}
                type="button"
                onClick={() => setStatusFilter(s)}
                className={`h-7 px-2.5 rounded-full text-[11.5px] border transition-colors inline-flex items-center gap-1 ${
                  active
                    ? "bg-foreground text-background border-foreground"
                    : "bg-white text-foreground/70 border-[var(--border)] hover:border-foreground/30"
                }`}
              >
                {s === "all" ? "Tous" : statusLabel(s)}
                <span
                  className={`text-[10px] font-mono tabular-nums ${active ? "text-background/60" : "text-foreground/40"}`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Tag chips */}
        {allTags.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[10.5px] uppercase tracking-[0.08em] font-semibold text-foreground/40 mr-1">
              Tags
            </span>
            <button
              type="button"
              onClick={() => setTagFilter("all")}
              className={`h-7 px-2.5 rounded-full text-[11.5px] border transition-colors ${
                tagFilter === "all"
                  ? "bg-foreground text-background border-foreground"
                  : "bg-white text-foreground/70 border-[var(--border)] hover:border-foreground/30"
              }`}
            >
              Tous
            </button>
            {allTags.map((tag) => {
              const active = tagFilter === tag;
              return (
                <button
                  key={tag}
                  type="button"
                  onClick={() => setTagFilter(active ? "all" : tag)}
                  className={`h-7 px-2.5 rounded-full text-[11.5px] border transition-colors inline-flex items-center gap-1 ${
                    active
                      ? "bg-[var(--accent)] text-background border-[var(--accent)]"
                      : "bg-[var(--accent)]/5 text-[var(--accent)] border-[var(--accent)]/20 hover:border-[var(--accent)]/40"
                  }`}
                >
                  {tag}
                </button>
              );
            })}
          </div>
        )}

        {/* Rating filter */}
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-[10.5px] uppercase tracking-[0.08em] font-semibold text-foreground/40 mr-1">
            Note
          </span>
          {[0, 1, 2, 3, 4, 5].map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => setRatingFilter(r)}
              className={`h-7 px-2.5 rounded-full text-[11.5px] border transition-colors ${
                ratingFilter === r
                  ? "bg-foreground text-background border-foreground"
                  : "bg-white text-foreground/70 border-[var(--border)] hover:border-foreground/30"
              }`}
            >
              {r === 0 ? "Toutes" : `${r}+ ★`}
            </button>
          ))}
        </div>
      </div>

      {/* ─── Bulk actions bar ──────────────────────────── */}
      {selectedCount > 0 && (
        <div className="bg-foreground text-background rounded-2xl px-4 py-2.5 mb-3 flex items-center justify-between gap-3 sticky top-3 z-20 shadow-[0_8px_24px_-8px_rgba(10,10,10,0.25)]">
          <span className="text-[12.5px] font-medium">
            {selectedCount} candidat{selectedCount > 1 ? "s" : ""} selectionne
            {selectedCount > 1 ? "s" : ""}
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={bulkAddTag}
              className="h-8 px-3 rounded-full bg-background/15 text-background hover:bg-background/25 text-[12px] font-medium inline-flex items-center gap-1.5"
            >
              <PlusCircle width={11} height={11} strokeWidth={2.2} />
              Ajouter tag
            </button>
            <select
              value=""
              onChange={(e) => {
                if (e.target.value)
                  bulkChangeStatus(e.target.value as EmployerApplicationStatus);
              }}
              className="h-8 px-3 rounded-full bg-background/15 text-background hover:bg-background/25 text-[12px] font-medium border-0 outline-none cursor-pointer"
            >
              <option value="">Changer statut...</option>
              {KANBAN_STATUSES.map((s) => (
                <option key={s} value={s} className="text-foreground">
                  {statusLabel(s)}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={bulkDelete}
              className="h-8 px-3 rounded-full bg-destructive/85 text-background hover:bg-destructive text-[12px] font-medium inline-flex items-center gap-1.5"
            >
              <Trash width={11} height={11} strokeWidth={2.2} />
              Supprimer
            </button>
            <button
              type="button"
              onClick={clearSelection}
              className="h-8 px-3 rounded-full bg-transparent text-background/70 hover:text-background text-[12px]"
            >
              Annuler
            </button>
          </div>
        </div>
      )}

      {/* ─── Table ───────────────────────────────────── */}
      {filteredData.length === 0 ? (
        <EmployerEmptyState
          icon={Group}
          title="Aucun candidat ne correspond."
          ctaLabel="Tout afficher"
          onCta={() => {
            setQuery("");
            setStatusFilter("all");
            setJobFilter("all");
            setTagFilter("all");
            setRatingFilter(0);
            setVivierOnly(false);
          }}
        />
      ) : (
        <div className="bg-white border border-[var(--border)] rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <table
                className="border-separate border-spacing-0"
                style={{ width: table.getCenterTotalSize(), minWidth: "100%" }}
              >
                <thead className="sticky top-0 z-10">
                  {table.getHeaderGroups().map((headerGroup) => (
                    <tr key={headerGroup.id}>
                      <SortableContext
                        items={draggableIds}
                        strategy={horizontalListSortingStrategy}
                      >
                        {headerGroup.headers.map((header) => {
                          const colId = header.column.id;
                          const isDraggable = !NON_DRAGGABLE.has(colId);
                          const sortDir = header.column.getIsSorted();
                          return (
                            <DraggableHeader
                              key={header.id}
                              id={colId}
                              isDraggable={isDraggable}
                              width={header.getSize()}
                              canSort={header.column.getCanSort()}
                              sortDir={sortDir}
                              canResize={header.column.getCanResize()}
                              isResizing={header.column.getIsResizing()}
                              onSortClick={() =>
                                header.column.toggleSorting(undefined, true)
                              }
                              onResizeMouseDown={
                                header.getResizeHandler() as React.MouseEventHandler
                              }
                              onResizeTouchStart={
                                header.getResizeHandler() as React.TouchEventHandler
                              }
                            >
                              {flexRender(
                                header.column.columnDef.header,
                                header.getContext(),
                              )}
                            </DraggableHeader>
                          );
                        })}
                      </SortableContext>
                    </tr>
                  ))}
                </thead>
                <tbody>
                  {table.getRowModel().rows.map((row) => {
                    const isSelected = row.getIsSelected();
                    return (
                      <tr
                        key={row.id}
                        onClick={() =>
                          router.push(
                            `/recruteur/candidats/${row.original.id}`,
                          )
                        }
                        className={`cursor-pointer transition-colors ${
                          isSelected
                            ? "bg-[var(--accent)]/[0.04] hover:bg-[var(--accent)]/[0.08]"
                            : "hover:bg-[var(--background-alt)]/60"
                        }`}
                      >
                        {row.getVisibleCells().map((cell) => (
                          <td
                            key={cell.id}
                            style={{ width: cell.column.getSize() }}
                            className="border-b border-[var(--border)] px-3 py-2.5 text-[13px] text-foreground/85 align-middle overflow-hidden"
                          >
                            <div className="truncate">
                              {flexRender(
                                cell.column.columnDef.cell,
                                cell.getContext(),
                              )}
                            </div>
                          </td>
                        ))}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </DndContext>
          </div>
          <div className="px-4 py-2 border-t border-[var(--border)] text-[11.5px] text-foreground/50 flex items-center justify-between">
            <span>
              {filteredData.length} ligne{filteredData.length > 1 ? "s" : ""}
            </span>
            <span className="font-mono text-[10.5px] text-foreground/35">
              Glisser un en-tete pour reordonner · Glisser le bord droit pour
              redimensionner
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
