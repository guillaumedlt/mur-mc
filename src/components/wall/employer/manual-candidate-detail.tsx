"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  BadgeCheck,
  EditPencil,
  Mail,
  MapPin,
  Phone,
  Suitcase,
  Trash,
} from "iconoir-react";
import type { EmployerApplicationStatus } from "@/lib/employer-store";
import { statusLabel } from "@/lib/employer-store";
import { useManualCandidates, updateManualCandidateSupabase, deleteManualCandidateSupabase } from "@/lib/supabase/use-manual-candidates";
import { useMyJobs } from "@/lib/supabase/use-my-jobs";
import { useRouter } from "next/navigation";
import { ApplicationStatusPill } from "./status-pill";
import { StarRating } from "./star-rating";

type Props = { id: string };

const STATUSES: EmployerApplicationStatus[] = [
  "received", "reviewed", "interview", "offer", "hired", "rejected",
];

export function ManualCandidateDetail({ id }: Props) {
  const router = useRouter();
  const { candidates, refetch } = useManualCandidates();
  const { jobs } = useMyJobs();
  const mc = candidates.find((c) => c.id === id);

  const [editing, setEditing] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [location, setLocation] = useState("");
  const [headline, setHeadline] = useState("");
  const [notes, setNotes] = useState("");
  const [savedFlash, setSavedFlash] = useState(false);

  // Sync form when mc loads
  const [prevId, setPrevId] = useState<string | null>(null);
  if (mc && mc.id !== prevId) {
    setPrevId(mc.id);
    setName(mc.fullName);
    setEmail(mc.email);
    setPhone(mc.phone ?? "");
    setLocation(mc.location ?? "");
    setHeadline(mc.headline ?? "");
    setNotes(mc.notes ?? "");
  }

  if (!mc) {
    return (
      <div className="max-w-[1100px] mx-auto bg-white border border-[var(--border)] rounded-2xl p-12 text-center">
        <p className="font-display italic text-[18px] text-foreground">
          Ce candidat n&apos;existe plus.
        </p>
        <Link
          href="/recruteur/candidats"
          className="inline-flex h-10 mt-5 px-5 rounded-full bg-foreground text-background text-[13px] items-center"
        >
          Tous les candidats
        </Link>
      </div>
    );
  }

  const job = mc.jobId ? jobs.find((j) => j.id === mc.jobId) : null;

  const onStatusChange = async (status: string) => {
    await updateManualCandidateSupabase(mc.id, { status });
    refetch();
  };

  const onRatingChange = async (rating: number) => {
    await updateManualCandidateSupabase(mc.id, { rating });
    refetch();
  };

  const onSave = async () => {
    await updateManualCandidateSupabase(mc.id, {
      full_name: name || mc.fullName,
      email: email || null,
      phone: phone || null,
      location: location || null,
      headline: headline || null,
      notes: notes || null,
    });
    setSavedFlash(true);
    setEditing(false);
    refetch();
    window.setTimeout(() => setSavedFlash(false), 2000);
  };

  const onDelete = async () => {
    if (window.confirm(`Supprimer ${mc.fullName} ?`)) {
      await deleteManualCandidateSupabase(mc.id);
      router.push("/recruteur/candidats");
    }
  };

  return (
    <div className="max-w-[1100px] mx-auto">
      <Link
        href="/recruteur/candidats"
        className="inline-flex items-center gap-1.5 text-[12.5px] text-foreground/55 hover:text-foreground transition-colors mb-3 px-1"
      >
        <ArrowLeft width={12} height={12} strokeWidth={2} />
        Pool candidats
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 items-start">
        {/* Main */}
        <div className="lg:col-span-2 flex flex-col gap-3">
          {/* Header */}
          <header className="bg-white border border-[var(--border)] rounded-2xl px-5 sm:px-7 lg:px-9 py-6 lg:py-8">
            <div className="flex items-start gap-4">
              <span
                className="size-14 rounded-2xl flex items-center justify-center text-white font-display text-[18px] font-medium ring-1 ring-black/5 shrink-0"
                style={{ background: `linear-gradient(155deg, ${mc.avatarColor}, #122a3f)` }}
              >
                {mc.initials}
              </span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h1 className="font-display text-[24px] sm:text-[28px] tracking-[-0.015em] text-foreground">
                    {mc.fullName}
                  </h1>
                  <button
                    type="button"
                    onClick={() => setEditing(true)}
                    className="size-8 rounded-full hover:bg-[var(--background-alt)] flex items-center justify-center text-foreground/40 hover:text-foreground transition-colors shrink-0"
                    aria-label="Modifier le candidat"
                  >
                    <EditPencil width={14} height={14} strokeWidth={2} />
                  </button>
                </div>
                {mc.headline && (
                  <p className="text-[14px] text-muted-foreground mt-1">
                    {mc.headline}
                  </p>
                )}
                <div className="flex flex-wrap items-center gap-2 mt-3">
                  <ApplicationStatusPill status={mc.status as EmployerApplicationStatus} />
                  {job && (
                    <span className="wall-badge" data-tone="muted">
                      <Suitcase /> {job.title}
                    </span>
                  )}
                  <span className="wall-badge" data-tone="muted">
                    {mc.source === "csv_import" ? "Import CSV" : "Ajout manuel"}
                  </span>
                </div>
              </div>
            </div>
          </header>

          {/* Info / Edit */}
          <article className="bg-white border border-[var(--border)] rounded-2xl px-5 sm:px-7 lg:px-9 py-6 lg:py-7">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-display text-[20px] tracking-[-0.01em]">
                Informations
              </h2>
              <button
                type="button"
                onClick={() => editing ? onSave() : setEditing(true)}
                className="h-9 px-4 rounded-full bg-foreground text-background text-[12.5px] font-medium hover:bg-foreground/85 transition-colors flex items-center gap-1.5"
              >
                {savedFlash ? (
                  <>
                    <BadgeCheck width={13} height={13} strokeWidth={2} />
                    Enregistre
                  </>
                ) : editing ? "Enregistrer" : "Modifier"}
              </button>
            </div>

            {editing ? (
              <div className="flex flex-col gap-3">
                <Field label="Nom complet" value={name} onChange={setName} />
                <Field label="Email" value={email} onChange={setEmail} type="email" />
                <Field label="Telephone" value={phone} onChange={setPhone} />
                <Field label="Lieu" value={location} onChange={setLocation} />
                <Field label="Poste" value={headline} onChange={setHeadline} />
                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] uppercase tracking-[0.08em] font-semibold text-foreground/60">Notes</label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={4}
                    placeholder="Remarques internes..."
                    className="bg-white border border-[var(--border)] rounded-xl px-3.5 py-3 text-[13.5px] outline-none placeholder:text-[var(--tertiary-foreground)] focus:border-[var(--accent)] transition-all leading-[1.6] resize-y"
                  />
                </div>
              </div>
            ) : (
              <dl className="flex flex-col gap-3">
                {mc.email && <InfoRow icon={Mail} label="Email" value={mc.email} />}
                {mc.phone && <InfoRow icon={Phone} label="Telephone" value={mc.phone} />}
                {mc.location && <InfoRow icon={MapPin} label="Lieu" value={mc.location} />}
                {mc.headline && <InfoRow icon={Suitcase} label="Poste" value={mc.headline} />}
                {mc.skills.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {mc.skills.map((s) => (
                      <span key={s} className="h-7 px-2.5 rounded-full text-[11.5px] bg-[var(--background-alt)] border border-[var(--border)] text-foreground/75">
                        {s}
                      </span>
                    ))}
                  </div>
                )}
                {mc.languages.length > 0 && (
                  <div className="text-[13px] text-foreground/70">
                    Langues : {mc.languages.join(", ")}
                  </div>
                )}
                {mc.coverLetter && (
                  <div className="mt-3 p-4 rounded-xl bg-[var(--background-alt)] border border-[var(--border)]">
                    <p className="ed-label-sm mb-2">Lettre / note</p>
                    <p className="text-[13px] text-foreground/85 leading-[1.65] whitespace-pre-line">
                      {mc.coverLetter}
                    </p>
                  </div>
                )}
                {mc.notes && (
                  <div className="mt-3 p-4 rounded-xl bg-[var(--background-alt)] border border-[var(--border)]">
                    <p className="ed-label-sm mb-2">Notes internes</p>
                    <p className="text-[13px] text-foreground/85 leading-[1.65] whitespace-pre-line">
                      {mc.notes}
                    </p>
                  </div>
                )}
              </dl>
            )}
          </article>
        </div>

        {/* Sidebar */}
        <aside className="lg:sticky lg:top-[140px] flex flex-col gap-3">
          {/* Status */}
          <div className="bg-white border border-[var(--border)] rounded-2xl p-5">
            <p className="ed-label-sm mb-3">Statut</p>
            <div className="flex flex-col gap-1.5">
              {STATUSES.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => onStatusChange(s)}
                  className={`h-9 px-3 rounded-lg text-[12.5px] text-left transition-colors ${
                    mc.status === s
                      ? "bg-foreground text-background font-medium"
                      : "text-foreground/70 hover:bg-[var(--background-alt)]"
                  }`}
                >
                  {statusLabel(s)}
                </button>
              ))}
            </div>
          </div>

          {/* Rating */}
          <div className="bg-white border border-[var(--border)] rounded-2xl p-5">
            <p className="ed-label-sm mb-3">Evaluation</p>
            <StarRating value={mc.rating} onChange={onRatingChange} />
          </div>

          {/* Actions */}
          <div className="bg-white border border-[var(--border)] rounded-2xl p-5">
            <p className="ed-label-sm mb-3">Actions</p>
            <button
              type="button"
              onClick={onDelete}
              className="w-full h-10 px-4 rounded-xl border border-[var(--border)] bg-white text-[12.5px] text-foreground/55 hover:text-destructive hover:border-destructive/30 transition-colors flex items-center justify-center gap-2"
            >
              <Trash width={12} height={12} strokeWidth={2} />
              Supprimer ce candidat
            </button>
          </div>
        </aside>
      </div>
    </div>
  );
}

function InfoRow({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-2.5 text-[13px]">
      <Icon width={13} height={13} strokeWidth={2} className="mt-[3px] text-foreground/45 shrink-0" />
      <div className="flex items-baseline gap-3">
        <dt className="text-foreground/55">{label}</dt>
        <dd className="text-foreground">{value}</dd>
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-[11px] uppercase tracking-[0.08em] font-semibold text-foreground/60">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="wall-input flex-1 text-[13.5px] placeholder:text-[var(--tertiary-foreground)]"
      />
    </div>
  );
}
