"use client";

import { useState } from "react";
import { Xmark } from "iconoir-react";

export const REJECTION_REASONS = [
  { value: "skills_gap", label: "Competences manquantes" },
  { value: "experience_gap", label: "Experience insuffisante" },
  { value: "culture_fit", label: "Adequation culture" },
  { value: "overqualified", label: "Surqualifie" },
  { value: "location", label: "Localisation / mobilite" },
  { value: "salary", label: "Attentes salariales" },
  { value: "no_response", label: "Pas de reponse du candidat" },
  { value: "hired_elsewhere", label: "Recrute ailleurs" },
  { value: "other", label: "Autre" },
] as const;

export type RejectionReason = (typeof REJECTION_REASONS)[number]["value"];

type Props = {
  candidateName: string;
  onCancel: () => void;
  onConfirm: (reason: RejectionReason, note: string) => void | Promise<void>;
};

export function RejectReasonModal({ candidateName, onCancel, onConfirm }: Props) {
  const [reason, setReason] = useState<RejectionReason>("skills_gap");
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const submit = async () => {
    if (submitting) return;
    setSubmitting(true);
    await onConfirm(reason, note.trim());
    setSubmitting(false);
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-foreground/15 backdrop-blur-[2px] flex items-start justify-center pt-[12vh] px-4"
      onClick={onCancel}
    >
      <div
        className="w-full max-w-[440px] bg-white rounded-2xl border border-[var(--border)] shadow-[0_24px_60px_rgba(10,10,10,0.18)] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-6 py-4 flex items-center justify-between border-b border-[var(--border)]">
          <div className="min-w-0">
            <p className="ed-label-sm">Motif de refus</p>
            <p className="text-[14px] font-medium text-foreground mt-0.5 truncate">
              {candidateName}
            </p>
          </div>
          <button
            type="button"
            onClick={onCancel}
            className="size-7 rounded-full hover:bg-foreground/5 flex items-center justify-center text-foreground/55"
            aria-label="Fermer"
          >
            <Xmark width={13} height={13} strokeWidth={2.2} />
          </button>
        </div>

        <div className="px-6 py-5 flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] uppercase tracking-[0.08em] font-semibold text-foreground/60">
              Raison
            </label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value as RejectionReason)}
              className="wall-select h-[38px]"
            >
              {REJECTION_REASONS.map((r) => (
                <option key={r.value} value={r.value}>
                  {r.label}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] uppercase tracking-[0.08em] font-semibold text-foreground/60">
              Note interne <span className="text-[var(--tertiary-foreground)] normal-case tracking-normal font-normal">· facultatif</span>
            </label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={3}
              placeholder="Contexte pour l'equipe (non visible par le candidat)"
              className="bg-white border border-[var(--border)] rounded-xl px-3 py-2 text-[13px] outline-none placeholder:text-[var(--tertiary-foreground)] focus:border-[var(--accent)] resize-y"
            />
          </div>
        </div>

        <div className="px-6 py-4 border-t border-[var(--border)] flex justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            disabled={submitting}
            className="h-9 px-3 rounded-full text-[12.5px] text-foreground/70 hover:text-foreground transition-colors disabled:opacity-40"
          >
            Annuler
          </button>
          <button
            type="button"
            onClick={submit}
            disabled={submitting}
            className="h-9 px-4 rounded-full bg-destructive text-background text-[12.5px] font-medium hover:bg-destructive/85 transition-colors disabled:opacity-40 inline-flex items-center gap-1.5"
          >
            {submitting && (
              <span className="size-3 border-2 border-background/30 border-t-background rounded-full animate-spin" />
            )}
            Confirmer le refus
          </button>
        </div>
      </div>
    </div>
  );
}
