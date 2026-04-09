"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowLeft as ChevLeft,
  ArrowRight as ChevRight,
  Calendar,
  Download,
  Eye,
  Mail,
  Phone,
  Sparks,
} from "iconoir-react";
import { CvPreviewModal } from "./cv-preview-modal";
import {
  type EmployerApplication,
  type EmployerApplicationStatus,
  type EmployerCandidate,
  KANBAN_STATUSES,
  moveApplication,
  statusLabel,
} from "@/lib/employer-store";
import { StarRatingCompact } from "./star-rating";

type Props = {
  byStatus: Record<EmployerApplicationStatus, EmployerApplication[]>;
  candidates: EmployerCandidate[];
  jobId: string;
};

export function KanbanMobileTabs({ byStatus, candidates }: Props) {
  const [active, setActive] =
    useState<EmployerApplicationStatus>("received");

  const items = byStatus[active];

  return (
    <div>
      {/* Tab bar */}
      <div className="flex gap-1.5 overflow-x-auto pb-3 wall-scroll [&::-webkit-scrollbar-track]:my-1">
        {KANBAN_STATUSES.map((s) => {
          const count = byStatus[s].length;
          const isCurrent = s === active;
          return (
            <button
              key={s}
              type="button"
              onClick={() => setActive(s)}
              className={`h-9 px-3 rounded-full text-[12px] border transition-colors inline-flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
                isCurrent
                  ? "bg-foreground text-background border-foreground"
                  : "bg-white text-foreground/75 border-[var(--border)] hover:border-foreground/30"
              }`}
            >
              {statusLabel(s)}
              <span
                className={`font-mono tabular-nums text-[10.5px] ${
                  isCurrent ? "text-background/70" : "text-foreground/45"
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Cards */}
      {items.length === 0 ? (
        <div className="rounded-2xl border border-[var(--border)] bg-white p-10 text-center">
          <p className="font-display italic text-[16px] text-foreground">
            Aucun candidat dans cette colonne.
          </p>
        </div>
      ) : (
        <ul className="flex flex-col gap-2">
          {items.map((app) => {
            const cand = candidates.find((c) => c.id === app.candidateId);
            if (!cand) return null;
            return (
              <MobileCard
                key={app.id}
                app={app}
                candidate={cand}
                currentStatus={active}
              />
            );
          })}
        </ul>
      )}
    </div>
  );
}

function MobileCard({
  app,
  candidate,
  currentStatus,
}: {
  app: EmployerApplication;
  candidate: EmployerCandidate;
  currentStatus: EmployerApplicationStatus;
}) {
  const [previewOpen, setPreviewOpen] = useState(false);
  const idx = KANBAN_STATUSES.indexOf(currentStatus);
  const canPrev = idx > 0;
  const canNext = idx < KANBAN_STATUSES.length - 1;
  const prevStatus = canPrev ? KANBAN_STATUSES[idx - 1] : null;
  const nextStatus = canNext ? KANBAN_STATUSES[idx + 1] : null;

  return (
    <li className="rounded-xl border border-[var(--border)] bg-white p-3 flex items-center gap-3">
      <Link
        href={`/recruteur/candidats/${app.id}`}
        className="flex items-start gap-2.5 min-w-0 flex-1"
      >
        <span
          className="size-9 rounded-lg flex items-center justify-center text-white font-display text-[11px] font-medium ring-1 ring-black/5 shrink-0"
          style={{
            background: `linear-gradient(155deg, ${candidate.avatarColor}, #122a3f)`,
          }}
          aria-hidden
        >
          {candidate.initials}
        </span>
        <div className="min-w-0 flex-1">
          <div className="text-[13px] font-medium text-foreground line-clamp-1">
            {candidate.fullName}
          </div>
          <div className="text-[11px] text-muted-foreground line-clamp-1">
            {candidate.headline}
          </div>
          <div className="flex items-center gap-1.5 mt-1.5">
            {app.matchScore >= 60 && (
              <span className="wall-badge" data-tone="accent">
                <Sparks /> {app.matchScore}%
              </span>
            )}
            {app.rating > 0 && <StarRatingCompact value={app.rating} />}
            <span className="text-[10px] font-mono text-[var(--tertiary-foreground)] inline-flex items-center gap-0.5 ml-auto">
              <Calendar width={9} height={9} strokeWidth={2} />
              {formatShort(app.appliedAt)}
            </span>
          </div>
          {/* Quick actions */}
          <div className="flex items-center gap-1 mt-2 pt-2 border-t border-[var(--border)]">
            <button
              type="button"
              onClick={() => setPreviewOpen(true)}
              className="size-7 rounded-lg hover:bg-[var(--accent)]/10 flex items-center justify-center text-foreground/50 hover:text-[var(--accent)] transition-colors"
              title="Aperçu rapide"
            >
              <Eye width={12} height={12} strokeWidth={2} />
            </button>
            {candidate.email && (
              <a
                href={`mailto:${candidate.email}`}
                className="size-7 rounded-lg hover:bg-[var(--background-alt)] flex items-center justify-center text-foreground/50 hover:text-[var(--accent)] transition-colors"
                title={candidate.email}
              >
                <Mail width={12} height={12} strokeWidth={2} />
              </a>
            )}
            {candidate.phone && (
              <a
                href={`tel:${candidate.phone.replace(/\s/g, "")}`}
                className="size-7 rounded-lg hover:bg-[var(--background-alt)] flex items-center justify-center text-foreground/50 hover:text-[var(--accent)] transition-colors"
                title={candidate.phone}
              >
                <Phone width={12} height={12} strokeWidth={2} />
              </a>
            )}
            {candidate.cvFileName && (
              <button
                type="button"
                onClick={() => {
                  if (typeof window !== "undefined")
                    window.alert(`Téléchargement de ${candidate.cvFileName} (démo)`);
                }}
                className="size-7 rounded-lg hover:bg-[var(--background-alt)] flex items-center justify-center text-foreground/50 hover:text-[var(--accent)] transition-colors"
                title={candidate.cvFileName}
              >
                <Download width={12} height={12} strokeWidth={2} />
              </button>
            )}
          </div>
        </div>
      </Link>

      {/* Move buttons */}
      <div className="flex flex-col gap-1 shrink-0">
        <button
          type="button"
          disabled={!canPrev}
          onClick={() =>
            prevStatus && moveApplication(app.id, prevStatus)
          }
          className="size-7 rounded-lg border border-[var(--border)] bg-white flex items-center justify-center text-foreground/60 hover:text-foreground disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          aria-label={prevStatus ? `Déplacer vers ${statusLabel(prevStatus)}` : undefined}
        >
          <ChevLeft width={11} height={11} strokeWidth={2.2} />
        </button>
        <button
          type="button"
          disabled={!canNext}
          onClick={() =>
            nextStatus && moveApplication(app.id, nextStatus)
          }
          className="size-7 rounded-lg border border-[var(--border)] bg-white flex items-center justify-center text-foreground/60 hover:text-foreground disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          aria-label={nextStatus ? `Déplacer vers ${statusLabel(nextStatus)}` : undefined}
        >
          <ChevRight width={11} height={11} strokeWidth={2.2} />
        </button>
      </div>
      <CvPreviewModal
        app={app}
        candidate={candidate}
        open={previewOpen}
        onClose={() => setPreviewOpen(false)}
      />
    </li>
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
