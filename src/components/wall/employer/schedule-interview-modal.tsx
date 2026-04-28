"use client";

import { useState } from "react";
import {
  BadgeCheck,
  Calendar,
  Clock,
  Globe,
  MapPin,
  Xmark,
} from "iconoir-react";
import { useUser } from "@/lib/auth";
import { scheduleInterview } from "@/lib/supabase/use-interviews";

type Props = {
  applicationId: string;
  jobId: string;
  candidateName: string;
  onClose: () => void;
  onScheduled: () => void;
};

export function ScheduleInterviewModal({ applicationId, jobId, candidateName, onClose, onScheduled }: Props) {
  const user = useUser();
  const [type, setType] = useState<"onsite" | "visio" | "phone">("onsite");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("10:00");
  const [duration, setDuration] = useState("45");
  const [location, setLocation] = useState("Monaco");
  const [visioLink, setVisioLink] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !date) return;
    setSaving(true);

    const scheduledAt = new Date(`${date}T${time}:00`).toISOString();

    await scheduleInterview({
      applicationId,
      jobId,
      candidateName,
      interviewerId: user.id,
      interviewerName: user.name,
      type,
      scheduledAt,
      durationMinutes: parseInt(duration, 10) || 45,
      location: type === "onsite" ? location : undefined,
      visioLink: type === "visio" ? visioLink : undefined,
      notes: notes.trim() || undefined,
      createdBy: user.id,
    });

    // Email notification to candidate
    fetch("/api/notify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: "statut_mis_a_jour",
        data: {
          applicationId,
          newStatus: "interview",
          statusLabel: `Entretien planifie le ${new Date(scheduledAt).toLocaleDateString("fr-FR", { day: "numeric", month: "long", hour: "2-digit", minute: "2-digit" })}`,
        },
      }),
    }).catch(() => {});

    setSaving(false);
    setDone(true);
    onScheduled();
  };

  // Default to tomorrow — calcule une seule fois au mount pour eviter les re-render impurs
  const [tomorrow] = useState(
    () => new Date(Date.now() + 86400000).toISOString().slice(0, 10),
  );

  return (
    <div className="fixed inset-0 z-50 bg-foreground/15 backdrop-blur-[2px] flex items-start justify-center pt-[8vh] px-4" onClick={onClose}>
      <div className="w-full max-w-[500px] bg-white rounded-2xl border border-[var(--border)] shadow-[0_24px_60px_rgba(10,10,10,0.18)] overflow-hidden" onClick={(e) => e.stopPropagation()}>
        {done ? (
          <div className="px-7 py-12 text-center">
            <BadgeCheck width={28} height={28} strokeWidth={2} className="text-[var(--accent)] inline-block" />
            <p className="font-display text-[22px] text-foreground mt-4">Entretien planifie</p>
            <p className="text-[13px] text-muted-foreground mt-2">
              {type === "onsite" ? "En presentiel" : type === "visio" ? "En visio" : "Par telephone"} — {new Date(`${date}T${time}`).toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" })} a {time}
            </p>
            <button type="button" onClick={onClose} className="h-9 px-4 mt-5 rounded-full bg-foreground text-background text-[12.5px] font-medium">Fermer</button>
          </div>
        ) : (
          <form onSubmit={onSubmit}>
            <div className="px-6 py-4 flex items-center justify-between border-b border-[var(--border)]">
              <div>
                <p className="text-[14px] font-medium text-foreground">Planifier un entretien</p>
                <p className="text-[12px] text-muted-foreground">{candidateName}</p>
              </div>
              <button type="button" onClick={onClose} className="size-7 rounded-full hover:bg-foreground/5 flex items-center justify-center text-foreground/55">
                <Xmark width={13} height={13} strokeWidth={2.2} />
              </button>
            </div>

            <div className="px-6 py-5 flex flex-col gap-4">
              {/* Type */}
              <div>
                <p className="text-[11px] uppercase tracking-[0.08em] font-semibold text-foreground/60 mb-2">Type d&apos;entretien</p>
                <div className="flex gap-1.5">
                  {([["onsite", "Presentiel", MapPin], ["visio", "Visio", Globe], ["phone", "Telephone", Clock]] as const).map(([v, label, Icon]) => (
                    <button
                      key={v}
                      type="button"
                      onClick={() => setType(v)}
                      className={`flex-1 h-9 rounded-full text-[12px] border transition-colors flex items-center justify-center gap-1.5 ${
                        type === v ? "bg-foreground text-background border-foreground" : "bg-white text-foreground/70 border-[var(--border)]"
                      }`}
                    >
                      <Icon width={12} height={12} strokeWidth={2} />
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Date + Time */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] uppercase tracking-[0.08em] font-semibold text-foreground/60">Date</label>
                  <input
                    type="date"
                    value={date || tomorrow}
                    onChange={(e) => setDate(e.target.value)}
                    min={tomorrow}
                    required
                    className="mt-1 wall-input h-10 w-full text-[13px]"
                  />
                </div>
                <div>
                  <label className="text-[11px] uppercase tracking-[0.08em] font-semibold text-foreground/60">Heure</label>
                  <input
                    type="time"
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                    required
                    className="mt-1 wall-input h-10 w-full text-[13px]"
                  />
                </div>
              </div>

              {/* Duration */}
              <div>
                <label className="text-[11px] uppercase tracking-[0.08em] font-semibold text-foreground/60">Duree</label>
                <select value={duration} onChange={(e) => setDuration(e.target.value)} className="mt-1 wall-select h-10 w-full">
                  <option value="15">15 min</option>
                  <option value="30">30 min</option>
                  <option value="45">45 min</option>
                  <option value="60">1h</option>
                  <option value="90">1h30</option>
                  <option value="120">2h</option>
                </select>
              </div>

              {/* Location or visio link */}
              {type === "onsite" && (
                <div>
                  <label className="text-[11px] uppercase tracking-[0.08em] font-semibold text-foreground/60">Lieu</label>
                  <input type="text" value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Monaco — Carre d'Or" className="mt-1 wall-input h-10 w-full text-[13px]" />
                </div>
              )}
              {type === "visio" && (
                <div>
                  <label className="text-[11px] uppercase tracking-[0.08em] font-semibold text-foreground/60">Lien visio</label>
                  <input type="url" value={visioLink} onChange={(e) => setVisioLink(e.target.value)} placeholder="https://meet.google.com/..." className="mt-1 wall-input h-10 w-full text-[13px]" />
                </div>
              )}

              {/* Notes */}
              <div>
                <label className="text-[11px] uppercase tracking-[0.08em] font-semibold text-foreground/60">Notes (optionnel)</label>
                <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} placeholder="Instructions, preparation..." className="mt-1 w-full bg-white border border-[var(--border)] rounded-xl px-3.5 py-2.5 text-[13px] outline-none placeholder:text-[var(--tertiary-foreground)] focus:border-[var(--accent)] transition-all leading-[1.55] resize-y" />
              </div>
            </div>

            <div className="px-6 py-4 border-t border-[var(--border)] flex justify-end gap-2">
              <button type="button" onClick={onClose} className="h-9 px-3 rounded-full text-[12.5px] text-foreground/70">Annuler</button>
              <button type="submit" disabled={saving || !date} className="h-9 px-4 rounded-full bg-foreground text-background text-[12.5px] font-medium disabled:opacity-40 flex items-center gap-1.5">
                {saving ? <span className="size-3.5 border-2 border-background/30 border-t-background rounded-full animate-spin" /> : <Calendar width={12} height={12} strokeWidth={2} />}
                {saving ? "Planification..." : "Planifier"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
