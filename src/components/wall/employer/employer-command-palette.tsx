"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMyJobs } from "@/lib/supabase/use-my-jobs";
import { useMyApplications } from "@/lib/supabase/use-my-applications";

type Props = {
  open: boolean;
  onClose: () => void;
};

type Hit =
  | { kind: "action"; label: string; hint: string; href: string }
  | { kind: "job"; label: string; hint: string; href: string }
  | { kind: "candidate"; label: string; hint: string; href: string };

const ACTIONS: Hit[] = [
  { kind: "action", label: "Publier une offre", hint: "Nouveau job", href: "/recruteur/publier" },
  { kind: "action", label: "Ajouter un candidat", hint: "Import manuel", href: "/recruteur/candidats/ajouter" },
  { kind: "action", label: "Pool de candidats", hint: "Tous mes candidats", href: "/recruteur/candidats" },
  { kind: "action", label: "Reporting", hint: "KPIs & stats", href: "/recruteur/reporting" },
  { kind: "action", label: "Gerer l'equipe", hint: "Membres & roles", href: "/recruteur/equipe" },
  { kind: "action", label: "Fiche entreprise", hint: "Branding public", href: "/recruteur/entreprise" },
];

export function EmployerCommandPalette({ open, onClose }: Props) {
  const router = useRouter();
  const [q, setQ] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const { jobs } = useMyJobs();
  const { applications, candidates } = useMyApplications(null);

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

  const hits: Hit[] = useMemo(() => {
    const needle = q.trim().toLowerCase();
    const pool: Hit[] = [];
    // Actions (toujours visibles en tete)
    for (const a of ACTIONS) {
      if (!needle || a.label.toLowerCase().includes(needle)) pool.push(a);
    }
    // Jobs
    for (const j of jobs) {
      if (!needle || j.title.toLowerCase().includes(needle)) {
        pool.push({
          kind: "job",
          label: j.title,
          hint: `${j.type} · ${j.status}`,
          href: `/recruteur/offres/${j.id}`,
        });
      }
    }
    // Candidats
    for (const c of candidates) {
      if (
        !needle ||
        c.fullName.toLowerCase().includes(needle) ||
        c.email?.toLowerCase().includes(needle) ||
        c.headline?.toLowerCase().includes(needle)
      ) {
        // Retrouver la 1re application du candidat pour pointer dessus
        const app = applications.find((a) => a.candidateId === c.id);
        if (app) {
          pool.push({
            kind: "candidate",
            label: c.fullName,
            hint: c.headline ?? c.email ?? "Candidat",
            href: `/recruteur/candidats/${app.id}`,
          });
        }
      }
    }
    return pool.slice(0, 25);
  }, [q, jobs, applications, candidates]);

  const onSelect = (href: string) => {
    onClose();
    router.push(href);
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-foreground/15 backdrop-blur-[2px] flex items-start justify-center pt-[12vh] px-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Recherche recruteur"
    >
      <div
        className="w-full max-w-[640px] bg-white rounded-xl border border-[var(--border)] shadow-[0_24px_60px_rgba(10,10,10,0.18)] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 px-4 h-14 border-b border-[var(--border)]">
          <span className="text-[var(--tertiary-foreground)] text-[15px]">⌕</span>
          <input
            ref={inputRef}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Rechercher un candidat, une offre, une action..."
            className="flex-1 bg-transparent outline-none text-[14px]"
          />
          <kbd className="text-[11px] font-mono text-[var(--tertiary-foreground)] border border-[var(--border)] rounded px-1.5 py-px">
            ESC
          </kbd>
        </div>
        <div className="max-h-[55vh] overflow-y-auto wall-scroll">
          {hits.length === 0 ? (
            <div className="px-5 py-10 text-center text-[13px] text-[var(--tertiary-foreground)]">
              Aucun resultat pour « {q} »
            </div>
          ) : (
            <ul className="py-2">
              {hits.map((h, i) => (
                <li key={`${h.kind}-${i}`}>
                  <button
                    type="button"
                    onClick={() => onSelect(h.href)}
                    className="w-full flex items-center justify-between gap-3 px-4 py-2.5 hover:bg-[var(--background-alt)] transition-colors text-left"
                  >
                    <div className="min-w-0 flex items-center gap-3">
                      <KindBadge kind={h.kind} />
                      <div className="min-w-0">
                        <div className="text-[13.5px] font-medium truncate">{h.label}</div>
                        <div className="text-[11.5px] text-muted-foreground truncate">{h.hint}</div>
                      </div>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="px-4 py-2 border-t border-[var(--border)] bg-[var(--background-alt)]/40 flex items-center gap-3 text-[11px] text-foreground/55">
          <span>↵ Ouvrir</span>
          <span>ESC Fermer</span>
          <span className="ml-auto">
            <Link href="/recruteur" onClick={onClose} className="hover:text-foreground">
              Tableau de bord
            </Link>
          </span>
        </div>
      </div>
    </div>
  );
}

function KindBadge({ kind }: { kind: Hit["kind"] }) {
  const map: Record<Hit["kind"], { label: string; bg: string; text: string }> = {
    action: { label: "Action", bg: "bg-[var(--accent)]/10", text: "text-[var(--accent)]" },
    job: { label: "Offre", bg: "bg-emerald-500/10", text: "text-emerald-700" },
    candidate: { label: "Candidat", bg: "bg-amber-500/10", text: "text-amber-700" },
  };
  const s = map[kind];
  return (
    <span className={`shrink-0 h-5 px-2 rounded-full text-[10px] font-semibold uppercase tracking-[0.06em] inline-flex items-center ${s.bg} ${s.text}`}>
      {s.label}
    </span>
  );
}
