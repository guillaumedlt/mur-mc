"use client";

import { useEffect, useState } from "react";
import {
  BadgeCheck,
  BellNotification,
  Mail,
  Xmark,
} from "iconoir-react";

type Props = {
  open: boolean;
  onClose: () => void;
  /** Criteres pre-remplis depuis les filtres actifs. */
  criteria?: string;
};

/**
 * Modale "Creer une alerte email" — le candidat saisit son email
 * et recoit des notifications quand de nouvelles offres matchent.
 * Pour l'instant c'est un stub UI (pas de backend).
 */
export function AlertModal({ open, onClose, criteria }: Props) {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setSent(true);
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-foreground/15 backdrop-blur-[2px] flex items-start justify-center pt-[12vh] px-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-[440px] bg-white rounded-2xl border border-[var(--border)] shadow-[0_24px_60px_rgba(10,10,10,0.18)] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {sent ? (
          <div className="px-7 py-10 text-center">
            <BadgeCheck
              width={24}
              height={24}
              strokeWidth={2}
              className="text-[var(--accent)] inline-block"
            />
            <p className="text-[15px] font-medium text-foreground mt-3">
              Alerte creee
            </p>
            <p className="text-[12.5px] text-muted-foreground mt-1.5 max-w-xs mx-auto">
              Vous recevrez un email a {email} des qu&apos;une nouvelle offre
              correspond a vos criteres.
            </p>
            <button
              type="button"
              onClick={() => {
                setSent(false);
                setEmail("");
                onClose();
              }}
              className="h-9 px-4 mt-5 rounded-full bg-foreground text-background text-[12.5px] font-medium"
            >
              Fermer
            </button>
          </div>
        ) : (
          <form onSubmit={onSubmit}>
            <div className="px-6 py-4 flex items-center justify-between border-b border-[var(--border)]">
              <div className="flex items-center gap-2">
                <BellNotification
                  width={15}
                  height={15}
                  strokeWidth={2}
                  className="text-[var(--accent)]"
                />
                <span className="text-[14px] font-medium text-foreground">
                  Creer une alerte
                </span>
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

            <div className="px-6 py-5 flex flex-col gap-4">
              <p className="text-[13px] text-muted-foreground leading-snug">
                Recevez un email des qu&apos;une nouvelle offre correspond a vos
                criteres. Vous pouvez vous desabonner a tout moment.
              </p>

              {criteria && (
                <div className="rounded-xl bg-[var(--background-alt)] border border-[var(--border)] px-3.5 py-2.5 text-[12px] text-foreground/80">
                  <span className="text-[var(--tertiary-foreground)]">
                    Criteres :{" "}
                  </span>
                  {criteria}
                </div>
              )}

              <div className="wall-input h-11">
                <Mail
                  width={14}
                  height={14}
                  strokeWidth={2}
                  className="text-[var(--tertiary-foreground)] shrink-0"
                />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="votre@email.com"
                  required
                  className="flex-1 bg-transparent outline-none text-[13.5px] placeholder:text-[var(--tertiary-foreground)]"
                />
              </div>
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
                disabled={!email.trim()}
                className="h-9 px-4 rounded-xl bg-foreground text-background text-[12.5px] font-medium hover:bg-foreground/85 disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center gap-1.5"
              >
                <BellNotification width={12} height={12} strokeWidth={2} />
                Creer l&apos;alerte
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
