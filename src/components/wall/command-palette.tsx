"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import type { Job } from "@/lib/data";

type Props = {
  jobs: Job[];
  open: boolean;
  onClose: () => void;
};

export function CommandPalette({ jobs, open, onClose }: Props) {
  const [q, setQ] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

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

  const results = useMemo(() => {
    if (!q.trim()) return jobs.slice(0, 8);
    const needle = q.toLowerCase();
    return jobs
      .filter(
        (j) =>
          j.title.toLowerCase().includes(needle) ||
          j.company.name.toLowerCase().includes(needle) ||
          j.sector.toLowerCase().includes(needle) ||
          j.shortDescription.toLowerCase().includes(needle),
      )
      .slice(0, 12);
  }, [q, jobs]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-foreground/15 backdrop-blur-[2px] flex items-start justify-center pt-[12vh] px-4"
      onClick={onClose}
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
            placeholder="Rechercher dans toutes les offres de Monaco…"
            className="flex-1 bg-transparent outline-none text-[14px]"
          />
          <kbd className="text-[11px] font-mono text-[var(--tertiary-foreground)] border border-[var(--border)] rounded px-1.5 py-px">
            ESC
          </kbd>
        </div>
        <div className="max-h-[50vh] overflow-y-auto wall-scroll">
          {results.length === 0 ? (
            <div className="px-5 py-10 text-center text-[13px] text-[var(--tertiary-foreground)]">
              Aucun résultat pour « {q} »
            </div>
          ) : (
            <ul className="py-2">
              {results.map((job) => (
                <li key={job.id}>
                  <Link
                    href={`/jobs/${job.slug}`}
                    onClick={onClose}
                    className="flex items-center justify-between px-4 py-3 hover:bg-[var(--background-alt)] transition-colors"
                  >
                    <div className="min-w-0">
                      <div className="text-[14px] font-medium truncate">
                        {job.title}
                      </div>
                      <div className="text-[12px] text-muted-foreground truncate">
                        {job.company.name} · {job.sector}
                      </div>
                    </div>
                    <span className="text-[11px] font-mono text-[var(--tertiary-foreground)] ml-3">
                      {job.type}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
