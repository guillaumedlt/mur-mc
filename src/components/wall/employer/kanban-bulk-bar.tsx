"use client";

import { useState } from "react";
import { Label, Xmark } from "iconoir-react";
import {
  KANBAN_STATUSES,
  statusLabel,
  type EmployerApplicationStatus,
} from "@/lib/employer-store";

type Props = {
  count: number;
  onMoveTo: (status: EmployerApplicationStatus) => void | Promise<void>;
  onReject: () => void;
  onTag: (tag: string) => void | Promise<void>;
  onClear: () => void;
};

export function KanbanBulkBar({ count, onMoveTo, onReject, onTag, onClear }: Props) {
  const [moving, setMoving] = useState<EmployerApplicationStatus | "">("");
  const [tagOpen, setTagOpen] = useState(false);
  const [tagValue, setTagValue] = useState("");

  if (count === 0) return null;

  const submitTag = async () => {
    const t = tagValue.trim();
    if (!t) return;
    await onTag(t);
    setTagValue("");
    setTagOpen(false);
  };

  return (
    <div className="fixed inset-x-0 bottom-4 z-40 flex justify-center pointer-events-none px-3">
      <div className="pointer-events-auto bg-foreground text-background rounded-full shadow-[0_24px_60px_rgba(10,10,10,0.28)] px-2 py-1.5 flex items-center gap-1 flex-wrap max-w-full">
        <span className="px-3 py-1 text-[12.5px] font-medium">
          {count} selection{count > 1 ? "ne" : "ne"}
        </span>

        <select
          value={moving}
          onChange={async (e) => {
            const v = e.target.value as EmployerApplicationStatus | "";
            if (!v) return;
            setMoving(v);
            await onMoveTo(v);
            setMoving("");
          }}
          className="h-8 px-3 rounded-full bg-background/10 border border-background/20 text-[12.5px] text-background outline-none"
        >
          <option value="">Deplacer vers...</option>
          {KANBAN_STATUSES.filter((s) => s !== "rejected").map((s) => (
            <option key={s} value={s} className="text-foreground">
              {statusLabel(s)}
            </option>
          ))}
        </select>

        {tagOpen ? (
          <input
            autoFocus
            value={tagValue}
            onChange={(e) => setTagValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") { e.preventDefault(); submitTag(); }
              if (e.key === "Escape") { setTagOpen(false); setTagValue(""); }
            }}
            onBlur={() => { if (!tagValue.trim()) setTagOpen(false); }}
            placeholder="Tag a ajouter"
            className="h-8 px-3 rounded-full bg-background/10 border border-background/20 text-[12.5px] text-background placeholder:text-background/40 outline-none w-36"
          />
        ) : (
          <button
            type="button"
            onClick={() => setTagOpen(true)}
            className="h-8 px-3 rounded-full border border-background/20 hover:bg-background/10 text-background text-[12.5px] font-medium transition-colors inline-flex items-center gap-1.5"
          >
            <Label width={11} height={11} strokeWidth={2} />
            Tag
          </button>
        )}

        <button
          type="button"
          onClick={onReject}
          className="h-8 px-3 rounded-full bg-destructive/90 hover:bg-destructive text-background text-[12.5px] font-medium transition-colors"
        >
          Rejeter
        </button>

        <button
          type="button"
          onClick={onClear}
          className="size-8 rounded-full hover:bg-background/10 flex items-center justify-center"
          aria-label="Effacer la selection"
          title="Effacer la selection"
        >
          <Xmark width={13} height={13} strokeWidth={2.2} />
        </button>
      </div>
    </div>
  );
}
