"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Bag,
  BadgeCheck,
  Calendar,
  EditPencil,
  Hashtag,
  Mail,
  MapPin,
  Phone,
  PlusCircle,
  SendMail,
  Suitcase,
  Trash,
  Xmark,
} from "iconoir-react";
import type { EmployerApplicationStatus } from "@/lib/employer-store";
import { statusLabel } from "@/lib/employer-store";
import { useUser } from "@/lib/auth";
import {
  type CandidateEvent,
  useManualCandidates,
  updateManualCandidateSupabase,
  deleteManualCandidateSupabase,
  fetchCandidateEvents,
  addCandidateEvent,
  duplicateCandidateForJob,
  resetToPool,
} from "@/lib/supabase/use-manual-candidates";
import { useMyJobs } from "@/lib/supabase/use-my-jobs";
import { useRouter } from "next/navigation";
import { ApplicationStatusPill } from "./status-pill";
import { StarRating } from "./star-rating";

type Props = { id: string };

const STATUSES: EmployerApplicationStatus[] = [
  "received", "shortlisted", "reviewed", "interview", "offer", "hired", "rejected",
];

const SUGGESTED_TAGS = ["Top profil", "A recontacter", "Senior", "Bilingue", "Disponible", "Urgent"];

export function ManualCandidateDetail({ id }: Props) {
  const router = useRouter();
  const user = useUser();
  const { candidates, refetch } = useManualCandidates();
  const { jobs } = useMyJobs();
  const mc = candidates.find((c) => c.id === id);

  // Events timeline
  const [events, setEvents] = useState<CandidateEvent[]>([]);
  const [eventsLoaded, setEventsLoaded] = useState(false);
  useEffect(() => {
    if (id && !eventsLoaded) {
      setEventsLoaded(true);
      fetchCandidateEvents(id).then(setEvents);
    }
  }, [id, eventsLoaded]);

  const reloadEvents = () => fetchCandidateEvents(id).then(setEvents);

  // Tags
  const [tagInput, setTagInput] = useState("");

  // Propose for job
  const [proposeJobId, setProposeJobId] = useState("");

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
    const prev = mc.status;
    await updateManualCandidateSupabase(mc.id, { status });
    if (user) {
      await addCandidateEvent({
        candidateId: mc.id,
        type: "status_changed",
        fromStatus: prev,
        toStatus: status,
        createdBy: user.id,
      });
    }
    refetch();
    reloadEvents();
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

  const addTag = async (tag: string) => {
    const t = tag.trim();
    if (!t || mc.tags.includes(t)) return;
    const newTags = [...mc.tags, t];
    await updateManualCandidateSupabase(mc.id, { tags: newTags });
    if (user) {
      await addCandidateEvent({ candidateId: mc.id, type: "tag_added", text: t, createdBy: user.id });
    }
    setTagInput("");
    refetch();
    reloadEvents();
  };

  const removeTag = async (tag: string) => {
    const newTags = mc.tags.filter((t) => t !== tag);
    await updateManualCandidateSupabase(mc.id, { tags: newTags });
    refetch();
  };

  const onProposeForJob = async () => {
    if (!proposeJobId || !user) return;
    await duplicateCandidateForJob(mc.id, proposeJobId, mc.companyId, user.id);
    if (user) {
      await addCandidateEvent({ candidateId: mc.id, type: "job_linked", jobId: proposeJobId, createdBy: user.id, text: jobs.find((j) => j.id === proposeJobId)?.title });
    }
    setProposeJobId("");
    refetch();
    reloadEvents();
  };

  const onResetToPool = async () => {
    await resetToPool(mc.id);
    if (user) {
      await addCandidateEvent({ candidateId: mc.id, type: "job_unlinked", createdBy: user.id, text: "Remis dans le vivier" });
    }
    refetch();
    reloadEvents();
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

          {/* Timeline */}
          <article className="bg-white border border-[var(--border)] rounded-2xl px-5 sm:px-7 lg:px-9 py-6 lg:py-7">
            <h2 className="font-display text-[20px] tracking-[-0.01em] mb-5">Historique</h2>
            {events.length === 0 ? (
              <p className="text-[13px] text-muted-foreground italic">Aucun historique pour l&apos;instant.</p>
            ) : (
              <ol className="relative">
                <span className="absolute left-[15px] top-2 bottom-2 w-px bg-[var(--border)]" aria-hidden />
                {events.map((evt) => (
                  <li key={evt.id} className="relative pl-11 pb-5 last:pb-0">
                    <span className="absolute left-0 top-0.5 size-8 rounded-full bg-white border border-[var(--border)] flex items-center justify-center">
                      <EventIcon type={evt.type} />
                    </span>
                    <div>
                      <div className="flex items-baseline gap-2 flex-wrap">
                        <span className="text-[13px] font-medium text-foreground">{eventTypeLabel(evt.type)}</span>
                        <span className="text-[10.5px] font-mono text-[var(--tertiary-foreground)]">{formatRelative(evt.createdAt)}</span>
                      </div>
                      {evt.text && <p className="text-[12.5px] text-foreground/70 mt-0.5">{evt.text}</p>}
                      {evt.fromStatus && evt.toStatus && (
                        <p className="text-[11.5px] text-muted-foreground mt-0.5">{statusLabel(evt.fromStatus as EmployerApplicationStatus)} → {statusLabel(evt.toStatus as EmployerApplicationStatus)}</p>
                      )}
                    </div>
                  </li>
                ))}
              </ol>
            )}
          </article>
        </div>

        {/* Sidebar */}

        <aside className="lg:sticky lg:top-[140px] flex flex-col gap-3">
          {/* Tags — first and most prominent */}
          <div className="bg-white border border-[var(--accent)]/20 rounded-2xl p-5">
            <p className="ed-label-sm mb-3 text-[var(--accent)]">Tags</p>
            {mc.tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mb-3">
                {mc.tags.map((tag) => (
                  <span key={tag} className="inline-flex items-center gap-1 h-7 pl-2.5 pr-1 rounded-full bg-[var(--accent)]/10 border border-[var(--accent)]/20 text-[12px] text-[var(--accent)] font-medium">
                    <Hashtag width={10} height={10} strokeWidth={2} />
                    {tag}
                    <button type="button" onClick={() => removeTag(tag)} className="size-5 rounded-full hover:bg-[var(--accent)]/20 flex items-center justify-center ml-0.5">
                      <Xmark width={10} height={10} strokeWidth={2.5} />
                    </button>
                  </span>
                ))}
              </div>
            )}
            <div className="flex items-center gap-1.5">
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addTag(tagInput); } }}
                placeholder="Ajouter un tag..."
                className="flex-1 wall-input h-9 text-[12.5px]"
              />
              <button type="button" onClick={() => addTag(tagInput)} disabled={!tagInput.trim()} className="h-9 px-3 rounded-full bg-[var(--accent)] text-background text-[11.5px] font-medium disabled:opacity-30 flex items-center gap-1">
                <PlusCircle width={11} height={11} strokeWidth={2} />
                Ajouter
              </button>
            </div>
            <div className="flex flex-wrap gap-1 mt-3">
              {SUGGESTED_TAGS.filter((t) => !mc.tags.includes(t)).map((t) => (
                <button key={t} type="button" onClick={() => addTag(t)} className="h-6 px-2 rounded-full text-[10.5px] border border-[var(--border)] text-foreground/55 hover:text-[var(--accent)] hover:border-[var(--accent)]/30 transition-colors">
                  + {t}
                </button>
              ))}
            </div>
          </div>

          {/* Status + Rating side by side */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white border border-[var(--border)] rounded-2xl p-4">
              <p className="ed-label-sm mb-2.5">Statut</p>
              <div className="flex flex-col gap-1">
                {STATUSES.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => onStatusChange(s)}
                    className={`h-7 px-2 rounded-lg text-[11px] text-left transition-colors ${
                      mc.status === s
                        ? "bg-foreground text-background font-medium"
                        : "text-foreground/65 hover:bg-[var(--background-alt)]"
                    }`}
                  >
                    {statusLabel(s)}
                  </button>
                ))}
              </div>
            </div>
            <div className="bg-white border border-[var(--border)] rounded-2xl p-4">
              <p className="ed-label-sm mb-2.5">Note</p>
              <StarRating value={mc.rating} onChange={onRatingChange} />
            </div>
          </div>

          {/* Proposer pour une offre */}
          <div className="bg-white border border-[var(--border)] rounded-2xl p-5">
            <p className="ed-label-sm mb-3">Proposer pour une offre</p>
            <div className="flex flex-col gap-2">
              <select
                value={proposeJobId}
                onChange={(e) => setProposeJobId(e.target.value)}
                className="wall-select h-9 text-[12.5px]"
              >
                <option value="">Choisir une offre...</option>
                {jobs.filter((j) => j.status === "published" && j.id !== mc.jobId).map((j) => (
                  <option key={j.id} value={j.id}>{j.title}</option>
                ))}
              </select>
              <button
                type="button"
                onClick={onProposeForJob}
                disabled={!proposeJobId}
                className="h-9 rounded-xl bg-[var(--accent)] text-background text-[12.5px] font-medium hover:bg-[var(--accent)]/85 disabled:opacity-40 transition-colors flex items-center justify-center gap-1.5"
              >
                <SendMail width={12} height={12} strokeWidth={2} />
                Proposer
              </button>
            </div>
            {mc.jobId && (
              <button
                type="button"
                onClick={onResetToPool}
                className="mt-2 w-full h-8 rounded-lg border border-[var(--border)] bg-white text-[11.5px] text-foreground/60 hover:text-foreground transition-colors flex items-center justify-center gap-1.5"
              >
                Remettre dans le vivier
              </button>
            )}
          </div>

          {/* Offre associee */}
          <div className="bg-white border border-[var(--border)] rounded-2xl p-5">
            <p className="ed-label-sm mb-3">Offre associee</p>
            {job ? (
              <Link
                href={`/recruteur/offres/${job.id}`}
                className="flex items-start gap-2.5 p-2.5 -mx-1 rounded-lg hover:bg-[var(--background-alt)] transition-colors group"
              >
                <Bag width={14} height={14} strokeWidth={2} className="mt-0.5 text-foreground/50 shrink-0" />
                <div className="min-w-0 flex-1">
                  <div className="text-[13px] font-medium text-foreground group-hover:text-[var(--accent)] transition-colors line-clamp-2">
                    {job.title}
                  </div>
                  <div className="text-[11px] text-muted-foreground mt-0.5">
                    {job.type} · {job.status === "published" ? "Publiee" : job.status}
                  </div>
                </div>
              </Link>
            ) : (
              <p className="text-[12.5px] text-muted-foreground mb-2">
                Aucune offre associee.
              </p>
            )}
            <select
              value={mc.jobId ?? ""}
              onChange={async (e) => {
                await updateManualCandidateSupabase(mc.id, {
                  job_id: e.target.value || null,
                });
                refetch();
              }}
              className="wall-select h-9 w-full mt-2 text-[12.5px]"
            >
              <option value="">Aucune offre</option>
              {jobs.map((j) => (
                <option key={j.id} value={j.id}>
                  {j.title}
                </option>
              ))}
            </select>
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

function EventIcon({ type }: { type: string }) {
  const cls = "text-foreground/50";
  switch (type) {
    case "status_changed": return <BadgeCheck width={13} height={13} strokeWidth={2} className={cls} />;
    case "tag_added": return <Hashtag width={13} height={13} strokeWidth={2} className={cls} />;
    case "job_linked": return <Bag width={13} height={13} strokeWidth={2} className="text-[var(--accent)]" />;
    case "job_unlinked": return <Xmark width={13} height={13} strokeWidth={2} className={cls} />;
    case "note": return <EditPencil width={13} height={13} strokeWidth={2} className={cls} />;
    case "contacted": return <Mail width={13} height={13} strokeWidth={2} className={cls} />;
    default: return <Calendar width={13} height={13} strokeWidth={2} className={cls} />;
  }
}

function eventTypeLabel(type: string): string {
  switch (type) {
    case "status_changed": return "Statut modifie";
    case "tag_added": return "Tag ajoute";
    case "job_linked": return "Propose pour une offre";
    case "job_unlinked": return "Retire du pipeline";
    case "note": return "Note ajoutee";
    case "contacted": return "Contacte";
    default: return "Evenement";
  }
}

function formatRelative(iso: string): string {
  const d = new Date(iso);
  const diff = Math.round((Date.now() - d.getTime()) / (1000 * 60));
  if (diff < 1) return "a l'instant";
  if (diff < 60) return `il y a ${diff} min`;
  const h = Math.round(diff / 60);
  if (h < 24) return `il y a ${h}h`;
  const days = Math.round(h / 24);
  if (days === 1) return "hier";
  if (days < 7) return `il y a ${days}j`;
  return new Date(iso).toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
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
