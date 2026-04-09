"use client";

import { useEffect, useRef, useState } from "react";
import { Xmark } from "iconoir-react";
import { addApplicationEvent } from "@/lib/employer-store";

type Props = {
  appId: string;
  recruiterName: string;
  open: boolean;
  onClose: () => void;
};

export function CandidateNoteModal({
  appId,
  recruiterName,
  open,
  onClose,
}: Props) {
  const [text, setText] = useState("");
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const [prevOpen, setPrevOpen] = useState(false);
  if (open && !prevOpen) {
    setPrevOpen(true);
    setText("");
  }
  if (!open && prevOpen) setPrevOpen(false);

  useEffect(() => {
    if (!open) return;
    const t = window.setTimeout(() => inputRef.current?.focus(), 30);
    return () => window.clearTimeout(t);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  const onAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;
    addApplicationEvent(appId, {
      type: "note_added",
      text: text.trim(),
      by: recruiterName,
    });
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-foreground/15 backdrop-blur-[2px] flex items-start justify-center pt-[12vh] px-4"
      onClick={onClose}
    >
      <form
        onSubmit={onAdd}
        className="w-full max-w-[500px] bg-white rounded-2xl border border-[var(--border)] shadow-[0_24px_60px_rgba(10,10,10,0.18)] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-6 py-4 flex items-center justify-between border-b border-[var(--border)]">
          <div className="text-[14px] font-medium text-foreground">
            Ajouter une note interne
          </div>
          <button
            type="button"
            onClick={onClose}
            className="size-7 rounded-full hover:bg-foreground/5 flex items-center justify-center text-foreground/55"
            aria-label="Fermer"
          >
            <Xmark width={13} height={13} strokeWidth={2.2} />
          </button>
        </div>
        <div className="px-6 py-5">
          <textarea
            ref={inputRef}
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Note interne (visible uniquement par ton équipe)…"
            rows={4}
            className="w-full bg-white border border-[var(--border)] rounded-xl px-3.5 py-3 text-[13.5px] outline-none placeholder:text-[var(--tertiary-foreground)] focus:border-[var(--accent)] focus:shadow-[0_0_0_3px_oklch(0.355_0.066_247_/_0.12)] transition-all leading-[1.6] resize-y"
          />
        </div>
        <div className="px-6 py-3 border-t border-[var(--border)] bg-[var(--background-alt)]/50 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="text-[12.5px] text-foreground/65 hover:text-foreground transition-colors px-3"
          >
            Annuler
          </button>
          <button
            type="submit"
            disabled={!text.trim()}
            className="h-9 px-4 rounded-xl bg-foreground text-background text-[12.5px] font-medium hover:bg-foreground/85 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            Ajouter
          </button>
        </div>
      </form>
    </div>
  );
}
