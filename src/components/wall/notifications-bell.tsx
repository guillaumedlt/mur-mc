"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  BadgeCheck,
  BellNotification,
  Calendar,
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

type Notif = {
  id: string;
  type: string;
  at: string;
  text?: string;
  by?: string;
  linkHref: string;
  title: string;
  subtitle: string;
};

const READ_KEY = "mur.notif.lastRead";

export function NotificationsBell() {
  const user = useUser();
  const [open, setOpen] = useState(false);

  // Candidate notifications
  const { applications: candidateApps } = useCandidateApplications();

  // Employer notifications
  const { applications: employerApps } = useMyApplications(null);
  const { candidates: manualCands } = useManualCandidates();

  const lastRead = (() => {
    if (typeof window === "undefined") return 0;
    const raw = window.localStorage.getItem(READ_KEY);
    return raw ? parseInt(raw, 10) : 0;
  })();

  const notifs: Notif[] = useMemo(() => {
    if (!user) return [];

    const list: Notif[] = [];

    if (user.role === "candidate") {
      // Candidate: notifications from application events
      for (const app of candidateApps) {
        for (const evt of app.events) {
          if (evt.type === "received") continue; // Skip initial "received" event
          list.push({
            id: `c-${app.id}-${evt.id}`,
            type: evt.type,
            at: evt.createdAt,
            text: evt.text,
            by: evt.by,
            linkHref: `/candidat/candidatures/${app.id}`,
            title: eventLabel(evt.type),
            subtitle: `${app.companyName} — ${app.jobTitle}`,
          });
        }
      }
    }

    if (user.role === "employer") {
      // Employer: new applications received
      for (const app of employerApps) {
        list.push({
          id: `e-${app.id}`,
          type: "received",
          at: app.appliedAt,
          title: "Nouvelle candidature",
          subtitle: `Candidature recue`,
          linkHref: `/recruteur/candidats/${app.id}`,
        });
      }

      // Manual candidates added recently
      for (const mc of manualCands) {
        list.push({
          id: `mc-${mc.id}`,
          type: "manual",
          at: mc.createdAt,
          title: `${mc.fullName} ajoute`,
          subtitle: mc.headline ?? "Candidat manuel",
          linkHref: `/recruteur/candidats/mc-${mc.id}`,
        });
      }
    }

    return list.sort((a, b) => b.at.localeCompare(a.at)).slice(0, 15);
  }, [user, candidateApps, employerApps, manualCands]);

  const unreadCount = notifs.filter(
    (n) => new Date(n.at).getTime() > lastRead,
  ).length;

  const onOpen = () => {
    setOpen(true);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(READ_KEY, String(Date.now()));
    }
  };

  if (!user) return null;

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => (open ? setOpen(false) : onOpen())}
        className="relative size-9 rounded-full border border-[var(--border)] bg-white text-foreground/70 hover:text-foreground hover:bg-[var(--background-alt)] transition-colors flex items-center justify-center"
        aria-label="Notifications"
      >
        <BellNotification width={14} height={14} strokeWidth={2} />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-[var(--accent)] text-white text-[10px] font-mono font-medium flex items-center justify-center tabular-nums ring-2 ring-white">
            {unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div
          className="absolute right-0 top-11 z-30 w-[360px] bg-white border border-[var(--border)] rounded-2xl shadow-[0_12px_32px_-8px_rgba(10,10,10,0.18)] overflow-hidden"
          onMouseLeave={() => setOpen(false)}
        >
          <div className="px-4 py-3 border-b border-[var(--border)] flex items-center justify-between">
            <div>
              <div className="text-[13px] font-medium text-foreground">
                Notifications
              </div>
              <div className="text-[11px] text-muted-foreground">
                {notifs.length === 0
                  ? "Rien de nouveau"
                  : `${unreadCount > 0 ? `${unreadCount} nouvelle${unreadCount > 1 ? "s" : ""}` : "A jour"}`}
              </div>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="size-7 rounded-full hover:bg-foreground/5 flex items-center justify-center text-foreground/55"
              aria-label="Fermer"
            >
              <Xmark width={12} height={12} strokeWidth={2.2} />
            </button>
          </div>

          {notifs.length === 0 ? (
            <div className="px-5 py-10 text-center">
              <BellNotification
                width={22}
                height={22}
                strokeWidth={1.6}
                className="text-foreground/35 inline-block"
              />
              <p className="text-[12.5px] text-muted-foreground mt-2">
                Aucune notification pour le moment.
              </p>
            </div>
          ) : (
            <ul className="max-h-[60vh] overflow-y-auto wall-scroll">
              {notifs.map((n) => {
                const isUnread = new Date(n.at).getTime() > lastRead;
                return (
                  <li key={n.id}>
                    <Link
                      href={n.linkHref}
                      onClick={() => setOpen(false)}
                      className={`flex items-start gap-3 px-4 py-3 hover:bg-[var(--background-alt)] transition-colors border-b border-[var(--border)] last:border-b-0 ${isUnread ? "bg-[var(--accent)]/[0.03]" : ""}`}
                    >
                      <span className="mt-0.5 size-8 rounded-full bg-[var(--background-alt)] border border-[var(--border)] flex items-center justify-center shrink-0">
                        <NotifIcon type={n.type} />
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="text-[12.5px] text-foreground flex items-center gap-1.5">
                          <span className="font-medium">{n.title}</span>
                          {isUnread && (
                            <span className="size-1.5 rounded-full bg-[var(--accent)] shrink-0" />
                          )}
                        </div>
                        <div className="text-[11.5px] text-muted-foreground line-clamp-1 mt-0.5">
                          {n.subtitle}
                        </div>
                        {n.text && (
                          <p className="text-[11.5px] text-foreground/70 italic line-clamp-1 mt-1">
                            {n.text}
                          </p>
                        )}
                        <div className="text-[10.5px] font-mono text-[var(--tertiary-foreground)] mt-1">
                          {formatRelative(n.at)}
                        </div>
                      </div>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

function NotifIcon({ type }: { type: string }) {
  const cls = "text-foreground/65";
  switch (type) {
    case "cv_viewed":
      return <UserCircle width={13} height={13} strokeWidth={2} className={cls} />;
    case "message_sent":
      return <Mail width={13} height={13} strokeWidth={2} className="text-[var(--accent)]" />;
    case "interview_scheduled":
      return <Calendar width={13} height={13} strokeWidth={2} className="text-[oklch(0.42_0.13_145)]" />;
    case "offer_sent":
    case "hired":
      return <BadgeCheck width={13} height={13} strokeWidth={2} className="text-[oklch(0.42_0.13_145)]" />;
    case "rejected":
      return <Xmark width={13} height={13} strokeWidth={2.4} className="text-destructive" />;
    case "received":
      return <SendMail width={13} height={13} strokeWidth={2} className={cls} />;
    case "manual":
      return <Sparks width={13} height={13} strokeWidth={2} className={cls} />;
    case "status_changed":
      return <BadgeCheck width={13} height={13} strokeWidth={2} className={cls} />;
    default:
      return <SendMail width={13} height={13} strokeWidth={2} className={cls} />;
  }
}

function eventLabel(type: string): string {
  switch (type) {
    case "cv_viewed": return "CV consulte";
    case "status_changed": return "Statut mis a jour";
    case "message_sent": return "Message du recruteur";
    case "interview_scheduled": return "Entretien planifie";
    case "offer_sent": return "Offre recue";
    case "hired": return "Embauche";
    case "rejected": return "Candidature refusee";
    case "note_added": return "Note ajoutee";
    case "received": return "Nouvelle candidature";
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
  return `il y a ${Math.round(diffD / 7)} sem`;
}
