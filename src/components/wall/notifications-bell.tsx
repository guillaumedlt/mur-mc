"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  BadgeCheck,
  BellNotification,
  Calendar,
  Mail,
  PageStar,
  SendMail,
  UserCircle,
  Xmark,
} from "iconoir-react";
import {
  type Application,
  type ApplicationEventType,
  eventLabel,
  useCandidate,
} from "@/lib/candidate-store";
import { useUser } from "@/lib/auth";

type Notif = {
  id: string;
  type: ApplicationEventType;
  at: string;
  text?: string;
  by?: string;
  app: Application;
};

const READ_KEY = "mur.notif.lastRead";

export function NotificationsBell() {
  const user = useUser();
  const { applications } = useCandidate();
  const [open, setOpen] = useState(false);

  // Last read timestamp lu à chaque ouverture (pas de useState pour rester simple)
  const lastRead = (() => {
    if (typeof window === "undefined") return 0;
    const raw = window.localStorage.getItem(READ_KEY);
    return raw ? parseInt(raw, 10) : 0;
  })();

  const notifs: Notif[] = useMemo(() => {
    if (!user || user.role !== "candidate") return [];
    const list: Notif[] = [];
    for (const app of applications) {
      // On notifie tous les events sauf l'envoi initial (déjà su)
      for (const evt of app.events) {
        if (evt.type === "applied") continue;
        list.push({
          id: `${app.id}-${evt.id}`,
          type: evt.type,
          at: evt.at,
          text: evt.text,
          by: evt.by,
          app,
        });
      }
    }
    return list.sort((a, b) => b.at.localeCompare(a.at)).slice(0, 10);
  }, [applications, user]);

  const unreadCount = notifs.filter(
    (n) => new Date(n.at).getTime() > lastRead,
  ).length;

  const onOpen = () => {
    setOpen(true);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(READ_KEY, String(Date.now()));
    }
  };

  if (!user || user.role !== "candidate") return null;

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
                  ? "Tu es à jour"
                  : `${notifs.length} dernière${notifs.length > 1 ? "s" : ""}`}
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
              {notifs.map((n) => (
                <li key={n.id}>
                  <Link
                    href={`/candidat/candidatures/${n.app.id}`}
                    onClick={() => setOpen(false)}
                    className="flex items-start gap-3 px-4 py-3 hover:bg-[var(--background-alt)] transition-colors border-b border-[var(--border)] last:border-b-0"
                  >
                    <span className="mt-0.5 size-8 rounded-full bg-[var(--background-alt)] border border-[var(--border)] flex items-center justify-center shrink-0">
                      <NotifIcon type={n.type} />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="text-[12.5px] text-foreground">
                        <span className="font-medium">
                          {eventLabel(n.type)}
                        </span>{" "}
                        <span className="text-foreground/65">
                          — {n.app.companyName}
                        </span>
                      </div>
                      <div className="text-[11.5px] text-muted-foreground line-clamp-1 mt-0.5">
                        {n.app.jobTitle}
                      </div>
                      {n.text && n.type === "message" && (
                        <p className="text-[11.5px] text-foreground/70 italic line-clamp-2 mt-1">
                          « {n.text} »
                        </p>
                      )}
                      <div className="text-[10.5px] font-mono text-[var(--tertiary-foreground)] mt-1.5">
                        {formatRelative(n.at)}
                      </div>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

function NotifIcon({ type }: { type: ApplicationEventType }) {
  const cls = "text-foreground/65";
  switch (type) {
    case "cv_viewed":
      return (
        <PageStar width={13} height={13} strokeWidth={2} className={cls} />
      );
    case "profile_viewed":
      return (
        <UserCircle width={13} height={13} strokeWidth={2} className={cls} />
      );
    case "message":
      return (
        <Mail
          width={13}
          height={13}
          strokeWidth={2}
          className="text-[var(--accent)]"
        />
      );
    case "interview_scheduled":
      return (
        <Calendar
          width={13}
          height={13}
          strokeWidth={2}
          className="text-[oklch(0.42_0.13_145)]"
        />
      );
    case "accepted":
      return (
        <BadgeCheck
          width={13}
          height={13}
          strokeWidth={2}
          className="text-[oklch(0.42_0.13_145)]"
        />
      );
    case "rejected":
      return (
        <Xmark
          width={13}
          height={13}
          strokeWidth={2.4}
          className="text-destructive"
        />
      );
    default:
      return (
        <SendMail width={13} height={13} strokeWidth={2} className={cls} />
      );
  }
}

function formatRelative(iso: string): string {
  const d = new Date(iso);
  const diffDays = Math.round(
    (Date.now() - d.getTime()) / (1000 * 60 * 60 * 24),
  );
  if (diffDays <= 0) return "aujourd'hui";
  if (diffDays === 1) return "hier";
  if (diffDays < 7) return `il y a ${diffDays} j`;
  return `il y a ${Math.round(diffDays / 7)} sem`;
}
