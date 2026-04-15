"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  BadgeCheck,
  BellNotification,
  Calendar,
  Check,
  Eye,
  Hashtag,
  Mail,
  SendMail,
  Sparks,
  UserCircle,
  Xmark,
} from "iconoir-react";
import { useUser } from "@/lib/auth";
import { useCandidateApplications } from "@/lib/supabase/use-candidate-applications";
import { useMyApplications } from "@/lib/supabase/use-my-applications";
import { useManualCandidates } from "@/lib/supabase/use-manual-candidates";
import { useMyJobs } from "@/lib/supabase/use-my-jobs";

type Notif = {
  id: string;
  type: string;
  at: string;
  text?: string;
  by?: string;
  linkHref: string;
  title: string;
  subtitle: string;
  category: "application" | "message" | "status" | "system";
};

type Filter = "all" | "application" | "message" | "status" | "system";

const READ_KEY = "mur.notif.lastRead";

/**
 * Wrapper: only renders the heavy NotificationPanel when opened.
 * Saves 4+ Supabase queries per page load.
 */
export function NotificationsBell() {
  const user = useUser();
  const [open, setOpen] = useState(false);
  const [hasOpened, setHasOpened] = useState(false);

  if (!user) return null;

  const onOpen = () => {
    setOpen(true);
    setHasOpened(true);
  };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => (open ? setOpen(false) : onOpen())}
        className="relative size-9 rounded-full border border-[var(--border)] bg-white text-foreground/70 hover:text-foreground hover:bg-[var(--background-alt)] transition-colors flex items-center justify-center"
        aria-label="Notifications"
      >
        <BellNotification width={14} height={14} strokeWidth={2} />
      </button>
      {hasOpened && (
        <NotificationPanel open={open} onClose={() => setOpen(false)} user={user} />
      )}
    </div>
  );
}

/** Heavy component — only mounted after first bell click. */
function NotificationPanel({ open, onClose, user }: { open: boolean; onClose: () => void; user: NonNullable<ReturnType<typeof useUser>> }) {
  const [filter, setFilter] = useState<Filter>("all");

  const { applications: candidateApps } = useCandidateApplications();
  const { applications: employerApps, candidates: employerCandidates } = useMyApplications(null);
  const { candidates: manualCands } = useManualCandidates();
  const { jobs } = useMyJobs();

  const lastRead = (() => {
    if (typeof window === "undefined") return 0;
    const raw = window.localStorage.getItem(READ_KEY);
    return raw ? parseInt(raw, 10) : 0;
  })();

  const notifs: Notif[] = useMemo(() => {
    if (!user) return [];
    const list: Notif[] = [];

    if (user.role === "candidate") {
      for (const app of candidateApps) {
        // Application received confirmation
        list.push({
          id: `c-applied-${app.id}`,
          type: "applied",
          at: app.appliedAt,
          linkHref: `/candidat/candidatures/${app.id}`,
          title: "Candidature envoyee",
          subtitle: `${app.companyName} — ${app.jobTitle}`,
          category: "application",
        });

        // Events (status changes, messages, etc.)
        for (const evt of app.events) {
          if (evt.type === "received") continue;
          const cat = evt.type === "message_sent" ? "message" : "status";
          list.push({
            id: `c-${app.id}-${evt.id}`,
            type: evt.type,
            at: evt.createdAt,
            text: evt.text,
            by: evt.by,
            linkHref: `/candidat/candidatures/${app.id}`,
            title: eventLabel(evt.type),
            subtitle: `${app.companyName} — ${app.jobTitle}`,
            category: cat,
          });
        }
      }
    }

    if (user.role === "employer") {
      for (const app of employerApps) {
        const cand = employerCandidates.find((c) => c.id === app.candidateId);
        const job = jobs.find((j) => j.id === app.jobId);
        list.push({
          id: `e-${app.id}`,
          type: "received",
          at: app.appliedAt,
          title: "Nouvelle candidature",
          subtitle: `${cand?.fullName ?? "Candidat"} — ${job?.title ?? "Offre"}`,
          linkHref: `/recruteur/candidats/${app.id}`,
          category: "application",
        });

        // Application events (status changes by team, messages)
        for (const evt of app.events) {
          if (evt.type === "received") continue;
          list.push({
            id: `e-${app.id}-${evt.id}`,
            type: evt.type,
            at: evt.at,
            text: evt.text,
            by: evt.by,
            linkHref: `/recruteur/candidats/${app.id}`,
            title: eventLabel(evt.type),
            subtitle: `${cand?.fullName ?? "Candidat"} — ${job?.title ?? "Offre"}`,
            category: evt.type === "message_sent" ? "message" : "status",
          });
        }
      }

      for (const mc of manualCands) {
        list.push({
          id: `mc-${mc.id}`,
          type: "manual",
          at: mc.createdAt,
          title: `${mc.fullName} ajoute au vivier`,
          subtitle: mc.headline ?? "Candidat manuel",
          linkHref: `/recruteur/candidats/mc-${mc.id}`,
          category: "system",
        });
      }
    }

    return list.sort((a, b) => b.at.localeCompare(a.at)).slice(0, 30);
  }, [user, candidateApps, employerApps, employerCandidates, manualCands, jobs]);

  const filtered = filter === "all" ? notifs : notifs.filter((n) => n.category === filter);

  const unreadCount = notifs.filter(
    (n) => new Date(n.at).getTime() > lastRead,
  ).length;

  const markAllRead = () => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem(READ_KEY, String(Date.now()));
    }
    onClose();
    setTimeout(() => {}, 10);
  };

  if (!open) return null;

  const FILTERS: Array<{ key: Filter; label: string; count: number }> = [
    { key: "all", label: "Tout", count: notifs.length },
    { key: "application", label: "Candidatures", count: notifs.filter((n) => n.category === "application").length },
    { key: "message", label: "Messages", count: notifs.filter((n) => n.category === "message").length },
    { key: "status", label: "Statuts", count: notifs.filter((n) => n.category === "status").length },
  ];

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-20" onClick={onClose} />

      {/* Panel */}
      <div className="absolute right-0 top-11 z-30 w-[400px] bg-white border border-[var(--border)] rounded-2xl shadow-[0_16px_48px_-8px_rgba(10,10,10,0.2)] overflow-hidden">
            {/* Header */}
            <div className="px-5 py-4 border-b border-[var(--border)]">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-[15px] font-display font-medium text-foreground">
                    Notifications
                  </h2>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    {unreadCount > 0
                      ? `${unreadCount} non lue${unreadCount > 1 ? "s" : ""}`
                      : "Vous etes a jour"}
                  </p>
                </div>
                <div className="flex items-center gap-1.5">
                  {unreadCount > 0 && (
                    <button
                      type="button"
                      onClick={markAllRead}
                      className="h-7 px-2.5 rounded-full text-[11px] text-[var(--accent)] hover:bg-[var(--accent)]/5 transition-colors flex items-center gap-1"
                    >
                      <Check width={11} height={11} strokeWidth={2.5} />
                      Tout lire
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={onClose}
                    className="size-7 rounded-full hover:bg-foreground/5 flex items-center justify-center text-foreground/55"
                    aria-label="Fermer"
                  >
                    <Xmark width={12} height={12} strokeWidth={2.2} />
                  </button>
                </div>
              </div>

              {/* Filter tabs */}
              <div className="flex items-center gap-1 mt-3">
                {FILTERS.map((f) => (
                  <button
                    key={f.key}
                    type="button"
                    onClick={() => setFilter(f.key)}
                    className={`h-7 px-2.5 rounded-full text-[11px] transition-colors inline-flex items-center gap-1 ${
                      filter === f.key
                        ? "bg-foreground text-background"
                        : "text-foreground/60 hover:bg-[var(--background-alt)]"
                    }`}
                  >
                    {f.label}
                    {f.count > 0 && (
                      <span className={`text-[9px] font-mono ${filter === f.key ? "text-background/60" : "text-foreground/35"}`}>
                        {f.count}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* List */}
            {filtered.length === 0 ? (
              <div className="px-5 py-12 text-center">
                <BellNotification
                  width={24}
                  height={24}
                  strokeWidth={1.6}
                  className="text-foreground/25 inline-block"
                />
                <p className="text-[13px] text-muted-foreground mt-3">
                  {filter === "all"
                    ? "Aucune notification"
                    : `Aucune notification de type "${FILTERS.find((f) => f.key === filter)?.label}"`}
                </p>
              </div>
            ) : (
              <ul className="max-h-[55vh] overflow-y-auto wall-scroll divide-y divide-[var(--border)]">
                {filtered.map((n) => {
                  const isUnread = new Date(n.at).getTime() > lastRead;
                  return (
                    <li key={n.id}>
                      <Link
                        href={n.linkHref}
                        onClick={onClose}
                        className={`flex items-start gap-3 px-5 py-3.5 hover:bg-[var(--background-alt)]/60 transition-colors ${
                          isUnread ? "bg-[var(--accent)]/[0.04]" : ""
                        }`}
                      >
                        <span className={`mt-0.5 size-9 rounded-xl flex items-center justify-center shrink-0 ${
                          isUnread
                            ? "bg-[var(--accent)]/10 border border-[var(--accent)]/20"
                            : "bg-[var(--background-alt)] border border-[var(--border)]"
                        }`}>
                          <NotifIcon type={n.type} unread={isUnread} />
                        </span>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5">
                            <span className={`text-[13px] line-clamp-1 ${isUnread ? "font-semibold text-foreground" : "font-medium text-foreground/85"}`}>
                              {n.title}
                            </span>
                            {isUnread && (
                              <span className="size-2 rounded-full bg-[var(--accent)] shrink-0" />
                            )}
                          </div>
                          <p className="text-[12px] text-muted-foreground line-clamp-1 mt-0.5">
                            {n.subtitle}
                          </p>
                          {n.text && (
                            <p className="text-[11.5px] text-foreground/60 italic line-clamp-1 mt-1">
                              {n.text}
                            </p>
                          )}
                          <span className="text-[10px] font-mono text-[var(--tertiary-foreground)] mt-1 inline-block">
                            {formatRelative(n.at)}
                          </span>
                        </div>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}

            {/* Footer */}
            {notifs.length > 0 && (
              <div className="px-5 py-3 border-t border-[var(--border)] text-center">
                <Link
                  href={user.role === "employer" ? "/recruteur/candidats" : "/candidat/candidatures"}
                  onClick={onClose}
                  className="text-[12px] text-[var(--accent)] hover:underline underline-offset-2"
                >
                  Voir tout
                </Link>
              </div>
            )}
          </div>
    </>
  );
}

function NotifIcon({ type, unread }: { type: string; unread: boolean }) {
  const cls = unread ? "text-[var(--accent)]" : "text-foreground/50";
  switch (type) {
    case "applied":
      return <SendMail width={14} height={14} strokeWidth={2} className={cls} />;
    case "cv_viewed":
      return <Eye width={14} height={14} strokeWidth={2} className={cls} />;
    case "message_sent":
      return <Mail width={14} height={14} strokeWidth={2} className={unread ? "text-[var(--accent)]" : "text-foreground/50"} />;
    case "interview_scheduled":
      return <Calendar width={14} height={14} strokeWidth={2} className={unread ? "text-[oklch(0.42_0.13_145)]" : cls} />;
    case "offer_sent":
    case "hired":
      return <BadgeCheck width={14} height={14} strokeWidth={2} className={unread ? "text-[oklch(0.42_0.13_145)]" : cls} />;
    case "rejected":
      return <Xmark width={14} height={14} strokeWidth={2.4} className="text-destructive" />;
    case "received":
      return <SendMail width={14} height={14} strokeWidth={2} className={cls} />;
    case "status_changed":
      return <BadgeCheck width={14} height={14} strokeWidth={2} className={cls} />;
    case "manual":
      return <UserCircle width={14} height={14} strokeWidth={2} className={cls} />;
    case "tag_added":
      return <Hashtag width={14} height={14} strokeWidth={2} className={cls} />;
    default:
      return <Sparks width={14} height={14} strokeWidth={2} className={cls} />;
  }
}

function eventLabel(type: string): string {
  switch (type) {
    case "applied": return "Candidature envoyee";
    case "cv_viewed": return "CV consulte";
    case "status_changed": return "Statut mis a jour";
    case "message_sent": return "Message recu";
    case "interview_scheduled": return "Entretien planifie";
    case "offer_sent": return "Offre recue";
    case "hired": return "Embauche";
    case "rejected": return "Non retenue";
    case "note_added": return "Note ajoutee";
    case "received": return "Nouvelle candidature";
    case "manual": return "Candidat ajoute";
    case "tag_added": return "Tag ajoute";
    default: return "Mise a jour";
  }
}

function formatRelative(iso: string): string {
  const d = new Date(iso);
  const diffMin = Math.round((Date.now() - d.getTime()) / (1000 * 60));
  if (diffMin < 1) return "a l'instant";
  if (diffMin < 60) return `il y a ${diffMin} min`;
  const diffH = Math.round(diffMin / 60);
  if (diffH < 24) return `il y a ${diffH}h`;
  const diffD = Math.round(diffH / 24);
  if (diffD === 1) return "hier";
  if (diffD < 7) return `il y a ${diffD}j`;
  if (diffD < 30) return `il y a ${Math.round(diffD / 7)} sem`;
  return new Date(iso).toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
}
