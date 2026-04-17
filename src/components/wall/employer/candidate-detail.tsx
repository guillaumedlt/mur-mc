"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  BadgeCheck,
  Calendar,
  Download,
  Eye,
  Globe,
  Hashtag,
  Mail,
  MapPin,
  MultiplePages,
  PageStar,
  Phone,
  SendMail,
  Sparks,
  UserCircle,
  Xmark,
} from "iconoir-react";
import {
  type EmployerApplicationEventType,
  KANBAN_STATUSES,
  eventLabel,
  statusLabel,
} from "@/lib/employer-store";
import { useMyApplications, moveApplicationSupabase, rateApplicationSupabase, updateApplicationSupabase } from "@/lib/supabase/use-my-applications";
import { useMyJobs } from "@/lib/supabase/use-my-jobs";
import { ApplicationStatusPill } from "./status-pill";
import { StarRating } from "./star-rating";
import { CandidateMessageModal } from "./candidate-message-modal";
import { CandidateNoteModal } from "./candidate-note-modal";
import { CvPreviewModal } from "./cv-preview-modal";
import { ScorecardModal } from "./scorecard-modal";
import { ScheduleInterviewModal } from "./schedule-interview-modal";
import { RejectReasonModal, REJECTION_REASONS, type RejectionReason } from "./reject-reason-modal";
import { CandidateMessagesThread } from "./candidate-messages-thread";
import { ScorecardCalibration } from "./scorecard-calibration";

type Props = { id: string; recruiterName: string };

export function CandidateDetail({ id, recruiterName }: Props) {
  const { applications, candidates, refetch } = useMyApplications(null);
  const { jobs } = useMyJobs();
  const [msgOpen, setMsgOpen] = useState(false);
  const [noteOpen, setNoteOpen] = useState(false);
  const [cvPreviewOpen, setCvPreviewOpen] = useState(false);
  const [scorecardOpen, setScorecardOpen] = useState(false);
  const [scheduleOpen, setScheduleOpen] = useState(false);
  const [rejectOpen, setRejectOpen] = useState(false);

  const [tagInput, setTagInput] = useState("");

  const app = applications.find((a) => a.id === id);
  const cand = app ? candidates.find((c) => c.id === app.candidateId) : null;
  const sbJob = app ? jobs.find((j) => j.id === app.jobId) : null;

  const appTags = app?.tags ?? [];

  const addTag = async (tag: string) => {
    const t = tag.trim();
    if (!t || !app || appTags.includes(t)) return;
    await updateApplicationSupabase(app.id, { tags: [...appTags, t] });
    setTagInput("");
    refetch();
  };

  const removeTag = async (tag: string) => {
    if (!app) return;
    await updateApplicationSupabase(app.id, { tags: appTags.filter((t) => t !== tag) });
    refetch();
  };

  if (!app || !cand) {
    return (
      <div className="max-w-[1100px] mx-auto bg-white border border-[var(--border)] rounded-2xl p-12 text-center">
        <p className="font-display italic text-[18px] text-foreground">
          Cette candidature n&apos;existe plus.
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

  const statusIdx = KANBAN_STATUSES.indexOf(app.status);
  const canAdvance = statusIdx >= 0 && statusIdx < KANBAN_STATUSES.length - 1;
  const nextStatus = canAdvance ? KANBAN_STATUSES[statusIdx + 1] : null;
  const events = [...app.events].sort((a, b) => b.at.localeCompare(a.at));

  return (
    <div className="max-w-[1100px] mx-auto">
      <Link
        href={`/recruteur/offres/${app.jobId}/candidats`}
        className="inline-flex items-center gap-1.5 text-[12.5px] text-foreground/55 hover:text-foreground transition-colors mb-3 px-1"
      >
        <ArrowLeft width={12} height={12} strokeWidth={2} />
        Pipeline · {sbJob?.title ?? "Offre"}
      </Link>

      {/* Hero */}
      <header className="bg-white border border-[var(--border)] rounded-2xl px-5 sm:px-7 lg:px-9 py-6 lg:py-7 mb-3">
        <div className="flex items-start gap-4 sm:gap-5">
          <span
            className="size-16 sm:size-20 rounded-2xl flex items-center justify-center text-white font-display text-[22px] sm:text-[26px] font-medium ring-1 ring-black/5 shadow-[0_2px_10px_-2px_rgba(10,10,10,0.18)] shrink-0"
            style={{
              background: `linear-gradient(155deg, ${cand.avatarColor}, #122a3f)`,
            }}
            aria-hidden
          >
            {cand.initials}
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="font-display text-[24px] sm:text-[28px] lg:text-[32px] leading-tight tracking-[-0.015em] text-foreground">
                {cand.fullName}
              </h1>
              <ApplicationStatusPill status={app.status} />
            </div>
            {cand.headline && (
              <p className="text-[14px] text-muted-foreground mt-1">
                {cand.headline}
              </p>
            )}
            {app.status === "rejected" && app.rejectionReason && (
              <p className="mt-2 inline-flex items-center gap-1.5 text-[11.5px] text-destructive bg-destructive/10 border border-destructive/20 rounded-full px-2.5 py-1">
                <span className="font-semibold">Motif :</span>
                {REJECTION_REASONS.find((r) => r.value === app.rejectionReason)?.label ?? app.rejectionReason}
                {app.rejectionNote && <span className="text-destructive/70 italic">· {app.rejectionNote}</span>}
              </p>
            )}
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 mt-3 text-[12.5px] text-foreground/65">
              {cand.email && (
                <span className="inline-flex items-center gap-1.5">
                  <Mail width={11} height={11} strokeWidth={2} /> {cand.email}
                </span>
              )}
              {cand.phone && (
                <span className="inline-flex items-center gap-1.5">
                  <Phone width={11} height={11} strokeWidth={2} /> {cand.phone}
                </span>
              )}
              {cand.location && (
                <span className="inline-flex items-center gap-1.5">
                  <MapPin width={11} height={11} strokeWidth={2} />{" "}
                  {cand.location}
                </span>
              )}
              {cand.linkedinUrl && (
                <span className="inline-flex items-center gap-1.5">
                  <Globe width={11} height={11} strokeWidth={2} />{" "}
                  {cand.linkedinUrl}
                </span>
              )}
            </div>

            <div className="flex items-center gap-3 mt-4">
              {app.matchScore >= 50 && (
                <span className="wall-badge" data-tone="accent">
                  <Sparks /> {app.matchScore}% match
                </span>
              )}
              <StarRating
                value={app.rating}
                onChange={(v) => rateApplicationSupabase(app.id, v).then(refetch)}
              />
            </div>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 items-start">
        {/* Colonne principale */}
        <div className="lg:col-span-2 flex flex-col gap-3">
          {/* Profil */}
          <article className="bg-white border border-[var(--border)] rounded-2xl px-5 sm:px-7 lg:px-9 py-6 lg:py-7">
            {cand.bio && (
              <Section title="À propos" icon={UserCircle}>
                <p className="text-[14px] leading-[1.7] text-foreground/85">
                  {cand.bio}
                </p>
              </Section>
            )}
            {cand.skills.length > 0 && (
              <Section title="Compétences" icon={Hashtag}>
                <div className="flex flex-wrap gap-1.5">
                  {cand.skills.map((s) => (
                    <span
                      key={s}
                      className="wall-badge"
                      data-tone="muted"
                    >
                      {s}
                    </span>
                  ))}
                </div>
              </Section>
            )}
            {cand.languages.length > 0 && (
              <Section title="Langues" icon={Globe}>
                <div className="flex flex-wrap gap-1.5">
                  {cand.languages.map((l) => (
                    <span
                      key={l}
                      className="wall-badge"
                      data-tone="muted"
                    >
                      {l}
                    </span>
                  ))}
                </div>
              </Section>
            )}
            {cand.cvFileName && (
              <Section title="CV" icon={PageStar}>
                <p className="text-[13px] text-foreground/80">
                  {cand.cvFileName}
                </p>
              </Section>
            )}
            {app.coverLetter && (
              <Section title="Lettre de motivation" icon={MultiplePages}>
                <p className="text-[13.5px] text-foreground/85 leading-[1.7] whitespace-pre-line italic font-display">
                  « {app.coverLetter} »
                </p>
              </Section>
            )}
          </article>

          {/* Evaluations */}
          <article className="bg-white border border-[var(--border)] rounded-2xl px-5 sm:px-7 lg:px-9 py-6 lg:py-7">
            <h2 className="font-display text-[20px] tracking-[-0.01em] mb-4">
              Evaluations
            </h2>
            <ScorecardCalibration applicationId={app.id} />
          </article>

          {/* Messages envoyes */}
          <article className="bg-white border border-[var(--border)] rounded-2xl px-5 sm:px-7 lg:px-9 py-6 lg:py-7">
            <h2 className="font-display text-[20px] tracking-[-0.01em] mb-4">
              Messages envoyes
            </h2>
            <CandidateMessagesThread applicationId={app.id} />
          </article>

          {/* Timeline */}
          <article className="bg-white border border-[var(--border)] rounded-2xl px-5 sm:px-7 lg:px-9 py-6 lg:py-7">
            <h2 className="font-display text-[20px] tracking-[-0.01em] mb-5">
              Historique
            </h2>
            <ol className="relative">
              <span
                className="absolute left-[15px] top-2 bottom-2 w-px bg-[var(--border)]"
                aria-hidden
              />
              {events.map((evt, i) => (
                <li key={evt.id} className="relative pl-11 pb-5 last:pb-0">
                  <span className="absolute left-0 top-0.5 size-8 rounded-full bg-white border border-[var(--border)] flex items-center justify-center">
                    <EventIcon type={evt.type} />
                  </span>
                  <div>
                    <div className="flex items-baseline gap-2 flex-wrap">
                      <h3 className="text-[13.5px] font-medium text-foreground">
                        {eventLabel(evt.type)}
                      </h3>
                      <time className="text-[11px] font-mono text-[var(--tertiary-foreground)]">
                        {formatRelative(evt.at)}
                      </time>
                    </div>
                    {evt.by && (
                      <p className="text-[12px] text-muted-foreground mt-0.5">
                        {evt.by}
                      </p>
                    )}
                    {evt.text && (
                      <p
                        className={`text-[13px] mt-1.5 leading-[1.6] ${
                          evt.type === "message_sent" || evt.type === "note_added"
                            ? "rounded-xl bg-[var(--background-alt)] border border-[var(--border)] px-3 py-2 font-display italic text-foreground/85"
                            : "text-foreground/75"
                        }`}
                      >
                        {evt.type === "message_sent"
                          ? `« ${evt.text} »`
                          : evt.text}
                      </p>
                    )}
                    {evt.from && evt.to && (
                      <p className="text-[12px] text-foreground/55 mt-1">
                        {statusLabel(evt.from)} → {statusLabel(evt.to)}
                      </p>
                    )}
                  </div>
                  {i === 0 && events.length > 1 && (
                    <span className="absolute -right-1 top-1.5 size-2 rounded-full bg-[var(--accent)] animate-pulse" />
                  )}
                </li>
              ))}
            </ol>
          </article>
        </div>

        {/* Sidebar : actions */}
        <aside className="lg:sticky lg:top-[140px] flex flex-col gap-3">
          {/* Tags */}
          <div className="bg-white border border-[var(--accent)]/20 rounded-2xl p-5">
            <p className="ed-label-sm mb-3 text-[var(--accent)]">Tags</p>
            {appTags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mb-3">
                {appTags.map((tag) => (
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
                + Ajouter
              </button>
            </div>
            <div className="flex flex-wrap gap-1 mt-3">
              {["Top profil", "A recontacter", "Senior", "Bilingue", "Disponible", "Urgent"].filter((t) => !appTags.includes(t)).map((t) => (
                <button key={t} type="button" onClick={() => addTag(t)} className="h-6 px-2 rounded-full text-[10.5px] border border-[var(--border)] text-foreground/55 hover:text-[var(--accent)] hover:border-[var(--accent)]/30 transition-colors">
                  + {t}
                </button>
              ))}
            </div>
          </div>

          <div className="bg-white border border-[var(--border)] rounded-2xl p-5">
            <p className="ed-label-sm mb-3">Actions</p>
            <div className="flex flex-col gap-2">
              {canAdvance && nextStatus && (
                <button
                  type="button"
                  onClick={() => moveApplicationSupabase(app.id, nextStatus, 0, app.status, recruiterName).then(refetch)}
                  className="h-10 rounded-xl bg-foreground text-background text-[12.5px] font-medium hover:bg-foreground/85 transition-colors flex items-center justify-center gap-2"
                >
                  <ArrowRight width={12} height={12} strokeWidth={2} />
                  Avancer vers « {statusLabel(nextStatus)} »
                </button>
              )}
              <button
                type="button"
                onClick={() => setCvPreviewOpen(true)}
                className="h-10 rounded-xl border border-[var(--border)] bg-white text-[12.5px] text-foreground/85 hover:bg-[var(--accent)]/[0.06] hover:text-[var(--accent)] hover:border-[var(--accent)]/30 transition-colors flex items-center justify-center gap-2"
              >
                <Eye width={12} height={12} strokeWidth={2} />
                Aperçu rapide du profil
              </button>
              <button
                type="button"
                onClick={() => setScheduleOpen(true)}
                className="h-10 rounded-xl border border-[var(--accent)]/30 bg-[var(--accent)]/[0.04] text-[12.5px] text-[var(--accent)] hover:bg-[var(--accent)]/10 transition-colors flex items-center justify-center gap-2"
              >
                <Calendar width={12} height={12} strokeWidth={2} />
                Planifier un entretien
              </button>
              <button
                type="button"
                onClick={() => setScorecardOpen(true)}
                className="h-10 rounded-xl border border-[var(--border)] bg-white text-[12.5px] text-foreground/85 hover:bg-[var(--background-alt)] transition-colors flex items-center justify-center gap-2"
              >
                <BadgeCheck width={12} height={12} strokeWidth={2} />
                Remplir une scorecard
              </button>
              <button
                type="button"
                onClick={() => setMsgOpen(true)}
                className="h-10 rounded-xl border border-[var(--border)] bg-white text-[12.5px] text-foreground/85 hover:bg-[var(--background-alt)] transition-colors flex items-center justify-center gap-2"
              >
                <SendMail width={12} height={12} strokeWidth={2} />
                Envoyer un message
              </button>
              <button
                type="button"
                onClick={() => setNoteOpen(true)}
                className="h-10 rounded-xl border border-[var(--border)] bg-white text-[12.5px] text-foreground/85 hover:bg-[var(--background-alt)] transition-colors flex items-center justify-center gap-2"
              >
                <MultiplePages width={12} height={12} strokeWidth={2} />
                Ajouter une note
              </button>
              {app.status !== "rejected" && (
                <button
                  type="button"
                  onClick={() => setRejectOpen(true)}
                  className="h-10 rounded-xl border border-[var(--border)] bg-white text-[12.5px] text-foreground/55 hover:text-destructive hover:border-destructive/30 transition-colors flex items-center justify-center gap-2"
                >
                  <Xmark width={12} height={12} strokeWidth={2.2} />
                  Refuser
                </button>
              )}
            </div>
          </div>

          <div className="bg-white border border-[var(--border)] rounded-2xl p-5">
            <p className="ed-label-sm mb-3">Contacter</p>
            <div className="flex flex-col gap-1.5">
              {cand.email && (
                <a
                  href={`mailto:${cand.email}`}
                  className="flex items-center gap-2.5 p-2 -mx-1 rounded-lg hover:bg-[var(--background-alt)] transition-colors text-[12.5px] text-foreground/85 hover:text-[var(--accent)]"
                >
                  <Mail width={13} height={13} strokeWidth={2} className="text-foreground/50 shrink-0" />
                  <span className="truncate">{cand.email}</span>
                </a>
              )}
              {cand.phone && (
                <a
                  href={`tel:${cand.phone.replace(/\s/g, "")}`}
                  className="flex items-center gap-2.5 p-2 -mx-1 rounded-lg hover:bg-[var(--background-alt)] transition-colors text-[12.5px] text-foreground/85 hover:text-[var(--accent)]"
                >
                  <Phone width={13} height={13} strokeWidth={2} className="text-foreground/50 shrink-0" />
                  <span>{cand.phone}</span>
                </a>
              )}
              {cand.cvFileName && (
                <button
                  type="button"
                  onClick={() => {
                    if (typeof window !== "undefined")
                      window.alert(`Téléchargement de ${cand.cvFileName} (démo)`);
                  }}
                  className="flex items-center gap-2.5 p-2 -mx-1 rounded-lg hover:bg-[var(--background-alt)] transition-colors text-[12.5px] text-foreground/85 hover:text-[var(--accent)] text-left"
                >
                  <Download width={13} height={13} strokeWidth={2} className="text-foreground/50 shrink-0" />
                  <span className="truncate">{cand.cvFileName}</span>
                </button>
              )}
              {cand.linkedinUrl && (
                <a
                  href={`https://${cand.linkedinUrl}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2.5 p-2 -mx-1 rounded-lg hover:bg-[var(--background-alt)] transition-colors text-[12.5px] text-[var(--accent)]"
                >
                  <Globe width={13} height={13} strokeWidth={2} className="text-foreground/50 shrink-0" />
                  <span className="truncate">{cand.linkedinUrl}</span>
                </a>
              )}
            </div>
          </div>

          <div className="bg-white border border-[var(--border)] rounded-2xl p-5">
            <p className="ed-label-sm mb-3">Offre liée</p>
            <Link
              href={`/recruteur/offres/${app.jobId}`}
              className="text-[13px] text-foreground hover:text-[var(--accent)] transition-colors"
            >
              {sbJob?.title ?? "Offre"}
            </Link>
          </div>

          <div className="bg-white border border-[var(--border)] rounded-2xl p-5">
            <p className="ed-label-sm mb-3">Détails</p>
            <dl className="flex flex-col gap-2 text-[13px]">
              <Row label="Candidaté" value={formatDate(app.appliedAt)} />
              <Row label="Mis à jour" value={formatRelative(app.updatedAt)} />
              <Row label="Match" value={`${app.matchScore}%`} />
              <Row
                label="Expérience"
                value={
                  cand.experienceYears
                    ? `${cand.experienceYears} ans`
                    : "—"
                }
              />
            </dl>
          </div>
        </aside>
      </div>

      <CandidateMessageModal
        appId={app.id}
        candidateName={cand.fullName}
        recruiterName={recruiterName}
        jobTitle={sbJob?.title ?? "Offre"}
        open={msgOpen}
        onClose={() => setMsgOpen(false)}
      />
      <CandidateNoteModal
        appId={app.id}
        recruiterName={recruiterName}
        open={noteOpen}
        onClose={() => setNoteOpen(false)}
      />
      <CvPreviewModal
        app={app}
        candidate={cand}
        open={cvPreviewOpen}
        onClose={() => setCvPreviewOpen(false)}
      />
      {scorecardOpen && (
        <ScorecardModal
          applicationId={app.id}
          candidateName={cand.fullName}
          jobCriteria={jobs.find((j) => j.id === app.jobId)?.scorecard_criteria ?? null}
          onClose={() => setScorecardOpen(false)}
          onSaved={refetch}
        />
      )}
      {scheduleOpen && (
        <ScheduleInterviewModal
          applicationId={app.id}
          jobId={app.jobId}
          candidateName={cand.fullName}
          onClose={() => setScheduleOpen(false)}
          onScheduled={refetch}
        />
      )}
      {rejectOpen && (
        <RejectReasonModal
          candidateName={cand.fullName}
          onCancel={() => setRejectOpen(false)}
          onConfirm={async (reason: RejectionReason, note: string) => {
            await moveApplicationSupabase(
              app.id,
              "rejected",
              0,
              app.status,
              recruiterName,
              { reason, note },
            );
            setRejectOpen(false);
            refetch();
          }}
        />
      )}
    </div>
  );
}

function Section({
  title,
  icon: Icon,
  children,
}: {
  title: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  children: React.ReactNode;
}) {
  return (
    <section className="mt-7 first:mt-0">
      <div className="flex items-center gap-2 mb-3">
        <Icon
          width={12}
          height={12}
          strokeWidth={2}
          className="text-foreground/55"
        />
        <h3 className="ed-label-sm">{title}</h3>
      </div>
      {children}
    </section>
  );
}

function EventIcon({
  type,
}: {
  type: EmployerApplicationEventType;
}) {
  const cls = "text-foreground/65";
  switch (type) {
    case "received":
      return <SendMail width={13} height={13} strokeWidth={2} className={cls} />;
    case "cv_viewed":
      return <PageStar width={13} height={13} strokeWidth={2} className={cls} />;
    case "status_changed":
      return <ArrowRight width={13} height={13} strokeWidth={2} className={cls} />;
    case "message_sent":
      return <Mail width={13} height={13} strokeWidth={2} className="text-[var(--accent)]" />;
    case "note_added":
      return <MultiplePages width={13} height={13} strokeWidth={2} className={cls} />;
    case "interview_scheduled":
      return <Calendar width={13} height={13} strokeWidth={2} className="text-[oklch(0.42_0.13_145)]" />;
    case "offer_sent":
      return <Sparks width={13} height={13} strokeWidth={2} className="text-[oklch(0.42_0.13_145)]" />;
    case "hired":
      return <BadgeCheck width={13} height={13} strokeWidth={2} className="text-[oklch(0.42_0.13_145)]" />;
    case "rejected":
      return <Xmark width={13} height={13} strokeWidth={2.4} className="text-destructive" />;
  }
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <dt className="text-foreground/55">{label}</dt>
      <dd className="text-foreground text-right truncate">{value}</dd>
    </div>
  );
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatRelative(iso: string): string {
  const d = new Date(iso);
  const diff = Math.round(
    (Date.now() - d.getTime()) / (1000 * 60 * 60 * 24),
  );
  if (diff <= 0) return "aujourd'hui";
  if (diff === 1) return "hier";
  if (diff < 7) return `il y a ${diff} j`;
  return `il y a ${Math.round(diff / 7)} sem`;
}
