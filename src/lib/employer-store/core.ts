"use client";

/**
 * Core state management for the employer store.
 * Shared mutable state + subscribe/snapshot for useSyncExternalStore.
 * All mutation modules import { cached, setCached, ensureLoaded, persist, emit, uid, slugify } from here.
 */

import { useSyncExternalStore } from "react";
import type { CandidateSource, EmployerState } from "./types";

/* ─── Storage / state ────────────────────────────────────────────── */

const STORAGE_KEY = "mur.employer";

export const EMPTY: EmployerState = {
  jobs: [],
  candidates: [],
  applications: [],
  companyProfile: null,
  team: [],
  onboarding: { completed: [] },
};

/** Module-level mutable state — the single source of truth. */
export let cached: EmployerState = EMPTY;
let loaded = false;
const subscribers = new Set<() => void>();

function loadFromStorage(): EmployerState {
  if (typeof window === "undefined") return EMPTY;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return EMPTY;
    const parsed = JSON.parse(raw) as Partial<EmployerState>;
    const jobs = Array.isArray(parsed.jobs) ? parsed.jobs : [];
    const candidates = Array.isArray(parsed.candidates)
      ? parsed.candidates
      : [];
    const applications = Array.isArray(parsed.applications)
      ? parsed.applications.map((a) => ({
          ...a,
          events: Array.isArray(a.events) ? a.events : [],
        }))
      : [];
    // Migration douce : source defaultee a "platform" sur les vieux candidats
    const migratedCandidates = candidates.map((c) => ({
      ...c,
      source: (c as { source?: CandidateSource }).source ?? ("platform" as CandidateSource),
    }));
    return {
      jobs,
      candidates: migratedCandidates,
      applications,
      companyProfile: parsed.companyProfile ?? null,
      team: Array.isArray(parsed.team) ? parsed.team : [],
      onboarding: parsed.onboarding ?? { completed: [] },
    };
  } catch {
    return EMPTY;
  }
}

export function persist(): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(cached));
}

export function ensureLoaded(): void {
  if (loaded || typeof window === "undefined") return;
  cached = loadFromStorage();
  loaded = true;
}

/** Replace cached state. All mutation modules must use this instead of direct assignment. */
export function setCached(next: EmployerState): void {
  cached = next;
}

/** Mark as loaded (used by seed). */
export function markLoaded(): void {
  loaded = true;
}

export function emit(): void {
  cached = { ...cached };
  for (const cb of subscribers) cb();
}

function subscribe(cb: () => void): () => void {
  ensureLoaded();
  subscribers.add(cb);
  const onStorage = (e: StorageEvent) => {
    if (e.key === STORAGE_KEY) {
      cached = loadFromStorage();
      cb();
    }
  };
  window.addEventListener("storage", onStorage);
  return () => {
    subscribers.delete(cb);
    window.removeEventListener("storage", onStorage);
  };
}

function getSnapshot(): EmployerState {
  ensureLoaded();
  return cached;
}

function getServerSnapshot(): EmployerState {
  return EMPTY;
}

/** Hook React : retourne l'etat complet du store recruteur. */
export function useEmployer(): EmployerState {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

/* ─── Utils ──────────────────────────────────────────────────────── */

export function uid(prefix: string): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.random()
    .toString(36)
    .slice(2, 7)}`;
}

export function slugify(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 60);
}

export function resetEmployer(): void {
  cached = EMPTY;
  loaded = true;
  if (typeof window !== "undefined") {
    window.localStorage.removeItem(STORAGE_KEY);
  }
  emit();
}
