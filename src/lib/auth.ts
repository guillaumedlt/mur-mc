"use client";

/**
 * Auth fake côté client : on stocke le user dans localStorage et on
 * expose un hook React qui re-rend tous les composants abonnés quand
 * l'état change. C'est suffisant pour faire tourner la démo (postuler,
 * publier une offre, dashboard…) sans backend pour le moment.
 *
 * Quand on branchera Supabase, il suffira de remplacer ces fonctions
 * par les vraies appels — la signature reste la même.
 */

import { useSyncExternalStore } from "react";

export type Role = "candidate" | "employer";

export type AuthUser = {
  id: string;
  name: string;
  email: string;
  role: Role;
  initials: string;
  avatarColor: string;
  /** Pour les employeurs : entreprise dont ils dépendent. */
  companyId?: string;
  companyName?: string;
};

const STORAGE_KEY = "mur.user";

let cached: AuthUser | null = null;
let loaded = false;
const subscribers = new Set<() => void>();

function loadFromStorage(): AuthUser | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as AuthUser) : null;
  } catch {
    return null;
  }
}

function ensureLoaded() {
  if (loaded || typeof window === "undefined") return;
  cached = loadFromStorage();
  loaded = true;
}

function emit() {
  for (const cb of subscribers) cb();
}

function subscribe(cb: () => void): () => void {
  ensureLoaded();
  subscribers.add(cb);
  // Sync entre onglets : écoute les changements localStorage venus
  // d'une autre fenêtre.
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

function getSnapshot(): AuthUser | null {
  ensureLoaded();
  return cached;
}

function getServerSnapshot(): AuthUser | null {
  return null;
}

/** Hook : retourne l'utilisateur courant ou `null` si déconnecté. */
export function useUser(): AuthUser | null {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

/** Connecte un utilisateur (persisté localStorage). */
export function signIn(user: AuthUser): void {
  cached = user;
  loaded = true;
  if (typeof window !== "undefined") {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
  }
  emit();
}

/** Déconnecte l'utilisateur courant. */
export function signOut(): void {
  cached = null;
  loaded = true;
  if (typeof window !== "undefined") {
    window.localStorage.removeItem(STORAGE_KEY);
  }
  emit();
}

/* ─── Comptes démo (préremplis dans la page connexion) ──────────── */

export const DEMO_CANDIDATE: AuthUser = {
  id: "u-cam",
  name: "Camille Laurent",
  email: "camille.laurent@example.mc",
  role: "candidate",
  initials: "CL",
  avatarColor: "#1C3D5A",
};

export const DEMO_EMPLOYER: AuthUser = {
  id: "u-pierre",
  name: "Pierre Reynaud",
  email: "p.reynaud@montecarlosbm.com",
  role: "employer",
  initials: "PR",
  avatarColor: "#7c1d2c",
  companyId: "c3",
  companyName: "Monte-Carlo Société des Bains de Mer",
};
