"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import {
  Calendar,
  Download,
  Eye,
  Mail,
  Phone,
  Sparks,
} from "iconoir-react";
import type {
  EmployerApplication,
  EmployerCandidate,
} from "@/lib/employer-store";
import { StarRatingCompact } from "./star-rating";
import { CvPreviewModal } from "./cv-preview-modal";

type Props = {
  app: EmployerApplication;
  candidate: EmployerCandidate;
  isDragging: boolean;
  onDragStart: (appId: string) => void;
  onDragEnd: () => void;
  selected?: boolean;
  onToggleSelect?: (appId: string) => void;
};

export function KanbanCard({
  app,
  candidate,
  isDragging,
  onDragStart,
  onDragEnd,
  selected = false,
  onToggleSelect,
}: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const [previewOpen, setPreviewOpen] = useState(false);

  return (
    <>
    <CvPreviewModal
      app={app}
      candidate={candidate}
      open={previewOpen}
      onClose={() => setPreviewOpen(false)}
    />
    <div
      ref={ref}
      draggable
      onDragStart={(e) => {
        e.dataTransfer.effectAllowed = "move";
        e.dataTransfer.setData("text/plain", app.id);
        if (ref.current) {
          e.dataTransfer.setDragImage(ref.current, 10, 10);
        }
        onDragStart(app.id);
      }}
      onDragEnd={onDragEnd}
      className={`relative rounded-xl border bg-white p-3 cursor-grab active:cursor-grabbing transition-all ${
        selected
          ? "border-[var(--accent)] ring-2 ring-[var(--accent)]/30"
          : "border-[var(--border)]"
      } ${
        isDragging
          ? "opacity-40 scale-[0.97]"
          : "opacity-100 hover:border-foreground/20 hover:shadow-[0_2px_12px_rgba(10,10,10,0.08)]"
      }`}
    >
      {onToggleSelect && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            e.preventDefault();
            onToggleSelect(app.id);
          }}
          className={`absolute top-2 right-2 size-5 rounded-md border flex items-center justify-center transition-colors z-10 ${
            selected
              ? "bg-[var(--accent)] border-[var(--accent)] text-background"
              : "bg-white border-[var(--border)] text-transparent hover:border-foreground/40"
          }`}
          aria-label={selected ? "Deselectionner" : "Selectionner"}
        >
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
            <path d="M2 5.5L4 7.5L8 2.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      )}
      {/* Top row : avatar + name + headline */}
      <Link
        href={`/recruteur/candidats/${app.id}`}
        className="block"
        onClick={(e) => {
          if (isDragging) e.preventDefault();
        }}
      >
        <div className="flex items-start gap-2.5">
          <span
            className="size-9 rounded-xl flex items-center justify-center text-white font-display text-[12px] font-medium ring-1 ring-black/5 shrink-0"
            style={{
              background: `linear-gradient(155deg, ${candidate.avatarColor}, #122a3f)`,
            }}
            aria-hidden
          >
            {candidate.initials}
          </span>
          <div className="min-w-0 flex-1 pr-5">
            <div className="text-[13px] font-medium text-foreground line-clamp-1">
              {candidate.fullName}
            </div>
            <div className="text-[11px] text-muted-foreground line-clamp-1 mt-0.5">
              {candidate.headline}
            </div>
          </div>
        </div>
      </Link>

      {/* Middle : badges */}
      <div className="flex items-center gap-1.5 mt-2.5 flex-wrap">
        {app.matchScore >= 60 && (
          <span className="wall-badge" data-tone="accent">
            <Sparks /> {app.matchScore}%
          </span>
        )}
        {app.rating > 0 && <StarRatingCompact value={app.rating} />}
        {app.coverLetter && (
          <span className="wall-badge" data-tone="muted">LM</span>
        )}
      </div>

      {/* Bottom : quick actions + date */}
      <div className="flex items-center justify-between mt-2.5 pt-2 border-t border-[var(--border)]">
        <div className="flex items-center gap-0.5">
          {/* Aperçu rapide CV */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              e.preventDefault();
              setPreviewOpen(true);
            }}
            className="size-7 rounded-lg hover:bg-[var(--accent)]/10 flex items-center justify-center text-foreground/50 hover:text-[var(--accent)] transition-colors"
            title="Aperçu rapide du profil"
          >
            <Eye width={12} height={12} strokeWidth={2} />
          </button>
          {candidate.email && (
            <a
              href={`mailto:${candidate.email}`}
              onClick={(e) => e.stopPropagation()}
              className="size-7 rounded-lg hover:bg-[var(--background-alt)] flex items-center justify-center text-foreground/50 hover:text-[var(--accent)] transition-colors"
              title={`Email : ${candidate.email}`}
            >
              <Mail width={12} height={12} strokeWidth={2} />
            </a>
          )}
          {candidate.phone && (
            <a
              href={`tel:${candidate.phone.replace(/\s/g, "")}`}
              onClick={(e) => e.stopPropagation()}
              className="size-7 rounded-lg hover:bg-[var(--background-alt)] flex items-center justify-center text-foreground/50 hover:text-[var(--accent)] transition-colors"
              title={`Appeler : ${candidate.phone}`}
            >
              <Phone width={12} height={12} strokeWidth={2} />
            </a>
          )}
          {candidate.cvFileName && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                if (typeof window !== "undefined")
                  window.alert(`Téléchargement de ${candidate.cvFileName} (démo)`);
              }}
              className="size-7 rounded-lg hover:bg-[var(--background-alt)] flex items-center justify-center text-foreground/50 hover:text-[var(--accent)] transition-colors"
              title={`CV : ${candidate.cvFileName}`}
            >
              <Download width={12} height={12} strokeWidth={2} />
            </button>
          )}
        </div>
        <span className="text-[10px] font-mono text-[var(--tertiary-foreground)] inline-flex items-center gap-1">
          <Calendar width={9} height={9} strokeWidth={2} />
          {formatShort(app.appliedAt)}
        </span>
      </div>
    </div>
    </>
  );
}

function formatShort(iso: string): string {
  const d = new Date(iso);
  const diff = Math.round(
    (Date.now() - d.getTime()) / (1000 * 60 * 60 * 24),
  );
  if (diff <= 0) return "auj.";
  if (diff === 1) return "hier";
  if (diff < 7) return `${diff}j`;
  return `${Math.round(diff / 7)}sem`;
}
