"use client";

import { useState } from "react";
import {
  BadgeCheck,
  Star,
  Xmark,
} from "iconoir-react";
import { useUser } from "@/lib/auth";
import { submitScorecard } from "@/lib/supabase/use-interviews";

export const DEFAULT_SCORECARD_CRITERIA = [
  "Competences techniques",
  "Soft skills / savoir-etre",
  "Langues",
  "Experience pertinente",
  "Motivation",
  "Adequation culturelle",
];

const RECOMMENDATIONS = [
  { value: "strong_yes", label: "Oui fort", color: "text-emerald-600" },
  { value: "yes", label: "Oui", color: "text-emerald-500" },
  { value: "maybe", label: "Peut-etre", color: "text-amber-500" },
  { value: "no", label: "Non", color: "text-red-500" },
  { value: "strong_no", label: "Non fort", color: "text-red-600" },
];

type Props = {
  applicationId: string;
  candidateName: string;
  /** Criteres custom definis sur le job. Fallback aux 6 par defaut si omis. */
  jobCriteria?: string[] | null;
  onClose: () => void;
  onSaved: () => void;
};

export function ScorecardModal({ applicationId, candidateName, jobCriteria, onClose, onSaved }: Props) {
  const user = useUser();
  const activeCriteria =
    jobCriteria && jobCriteria.length > 0 ? jobCriteria : DEFAULT_SCORECARD_CRITERIA;
  const [criteria, setCriteria] = useState(
    activeCriteria.map((name) => ({ name, rating: 0, comment: "" })),
  );
  const [recommendation, setRecommendation] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);

  const overallRating = Math.round(
    criteria.reduce((s, c) => s + c.rating, 0) / Math.max(1, criteria.filter((c) => c.rating > 0).length),
  );

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSaving(true);

    await submitScorecard({
      applicationId,
      interviewerId: user.id,
      interviewerName: user.name,
      overallRating,
      recommendation,
      notes: notes.trim() || undefined,
      criteria: criteria.filter((c) => c.rating > 0),
    });

    setSaving(false);
    setDone(true);
    onSaved();
  };

  return (
    <div className="fixed inset-0 z-50 bg-foreground/15 backdrop-blur-[2px] flex items-start justify-center pt-[4vh] px-4 overflow-y-auto" onClick={onClose}>
      <div className="w-full max-w-[600px] bg-white rounded-2xl border border-[var(--border)] shadow-[0_24px_60px_rgba(10,10,10,0.18)] overflow-hidden mb-8" onClick={(e) => e.stopPropagation()}>
        {done ? (
          <div className="px-7 py-12 text-center">
            <BadgeCheck width={28} height={28} strokeWidth={2} className="text-[var(--accent)] inline-block" />
            <p className="font-display text-[22px] text-foreground mt-4">Evaluation enregistree</p>
            <p className="text-[13px] text-muted-foreground mt-2">Note globale : {overallRating}/5 — {RECOMMENDATIONS.find((r) => r.value === recommendation)?.label ?? ""}</p>
            <button type="button" onClick={onClose} className="h-9 px-4 mt-5 rounded-full bg-foreground text-background text-[12.5px] font-medium">Fermer</button>
          </div>
        ) : (
          <form onSubmit={onSubmit}>
            {/* Header */}
            <div className="px-6 py-4 flex items-center justify-between border-b border-[var(--border)]">
              <div>
                <p className="text-[14px] font-medium text-foreground">Scorecard d&apos;entretien</p>
                <p className="text-[12px] text-muted-foreground">{candidateName}</p>
              </div>
              <button type="button" onClick={onClose} className="size-7 rounded-full hover:bg-foreground/5 flex items-center justify-center text-foreground/55">
                <Xmark width={13} height={13} strokeWidth={2.2} />
              </button>
            </div>

            <div className="px-6 py-5 flex flex-col gap-5 max-h-[65vh] overflow-y-auto wall-scroll">
              {/* Criteria */}
              <div>
                <p className="text-[11px] uppercase tracking-[0.08em] font-semibold text-foreground/60 mb-3">Criteres d&apos;evaluation</p>
                <div className="flex flex-col gap-3">
                  {criteria.map((c, i) => (
                    <div key={c.name} className="rounded-xl border border-[var(--border)] p-3">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[13px] font-medium text-foreground">{c.name}</span>
                        <div className="flex items-center gap-0.5">
                          {[1, 2, 3, 4, 5].map((v) => (
                            <button
                              key={v}
                              type="button"
                              onClick={() => {
                                const next = [...criteria];
                                next[i] = { ...c, rating: v };
                                setCriteria(next);
                              }}
                              className="p-0.5"
                            >
                              <Star
                                width={16}
                                height={16}
                                strokeWidth={2}
                                className={v <= c.rating ? "text-amber-400 fill-amber-400" : "text-foreground/20"}
                              />
                            </button>
                          ))}
                        </div>
                      </div>
                      <input
                        type="text"
                        value={c.comment}
                        onChange={(e) => {
                          const next = [...criteria];
                          next[i] = { ...c, comment: e.target.value };
                          setCriteria(next);
                        }}
                        placeholder="Commentaire optionnel..."
                        className="w-full bg-transparent text-[12px] text-foreground/70 outline-none placeholder:text-[var(--tertiary-foreground)]"
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Overall + recommendation */}
              <div className="rounded-xl bg-[var(--background-alt)] border border-[var(--border)] p-4 text-center">
                <p className="text-[10.5px] uppercase tracking-[0.08em] text-foreground/50 mb-1">Note globale</p>
                <p className="font-display text-[32px] text-foreground">{overallRating || "—"}<span className="text-[16px] text-foreground/40">/5</span></p>
              </div>

              <div>
                <p className="text-[11px] uppercase tracking-[0.08em] font-semibold text-foreground/60 mb-2">Recommandation</p>
                <div className="flex flex-wrap gap-1.5">
                  {RECOMMENDATIONS.map((r) => (
                    <button
                      key={r.value}
                      type="button"
                      onClick={() => setRecommendation(r.value)}
                      className={`h-8 px-3 rounded-full text-[12px] border transition-colors ${
                        recommendation === r.value
                          ? "bg-foreground text-background border-foreground"
                          : `bg-white ${r.color} border-[var(--border)] hover:border-foreground/30`
                      }`}
                    >
                      {r.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="text-[11px] uppercase tracking-[0.08em] font-semibold text-foreground/60">Notes libres</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                  placeholder="Impression generale, points d'attention..."
                  className="mt-1.5 w-full bg-white border border-[var(--border)] rounded-xl px-3.5 py-2.5 text-[13px] outline-none placeholder:text-[var(--tertiary-foreground)] focus:border-[var(--accent)] transition-all leading-[1.55] resize-y"
                />
              </div>
            </div>

            <div className="px-6 py-4 border-t border-[var(--border)] flex justify-end gap-2">
              <button type="button" onClick={onClose} className="h-9 px-3 rounded-full text-[12.5px] text-foreground/70">Annuler</button>
              <button
                type="submit"
                disabled={saving || !recommendation}
                className="h-9 px-4 rounded-full bg-foreground text-background text-[12.5px] font-medium disabled:opacity-40 transition-colors flex items-center gap-1.5"
              >
                {saving ? <span className="size-3.5 border-2 border-background/30 border-t-background rounded-full animate-spin" /> : <BadgeCheck width={12} height={12} strokeWidth={2} />}
                {saving ? "Envoi..." : "Enregistrer"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
