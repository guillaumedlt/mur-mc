"use client";

/**
 * Auth store cote client : on stocke le user dans localStorage et on
 * expose un hook React qui re-rend tous les composants abonnes quand
 * l'etat change. Sert de pont entre Supabase Auth (serveur) et les
 * composants client (useUser, EmployerShell, etc.).
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
  companyId?: string;
  companyName?: string;
};

const STORAGE_KEY = "mur.user";

let cached: AuthUser | null = null;
let loaded = false;
/**
 * `syncing` = true tant que SupabaseAuthSync n'a pas termine
 * son premier check. Pendant ce temps, useUser() retourne null
 * mais useAuthLoading() retourne true → les shells affichent
 * un skeleton au lieu de "Connecte-toi".
 */
let syncing = true;
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

export function useUser(): AuthUser | null {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

/**
 * Retourne true tant que le sync Supabase n'a pas termine.
 * Les shells doivent afficher un loader pendant ce temps,
 * PAS le message "Connecte-toi".
 */
export function useAuthLoading(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => syncing,
    () => true, // cote serveur on est toujours "loading"
  );
}

/** Appele par SupabaseAuthSync une fois le premier check fait. */
export function markAuthSynced(): void {
  syncing = false;
  emit();
}

export function signIn(user: AuthUser): void {
  cached = user;
  loaded = true;
  syncing = false;
  if (typeof window !== "undefined") {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
  }
  emit();
}

export function signOut(): void {
  cached = null;
  loaded = true;
  syncing = false;
  if (typeof window !== "undefined") {
    // Nettoyer TOUS les stores pour eviter la fuite de donnees
    // entre utilisateurs sur le meme navigateur.
    window.localStorage.removeItem(STORAGE_KEY);
    window.localStorage.removeItem("mur.employer");
    window.localStorage.removeItem("mur.candidate");
  }
  emit();
}

/* Comptes demo supprimes — l'auth passe par Supabase. */
