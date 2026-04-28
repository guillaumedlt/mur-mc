"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import {
  Search,
  LogOut,
  NavArrowDown,
  Building,
  User as UserIcon,
} from "iconoir-react";
import { signOut, useUser } from "@/lib/auth";
import { resetCandidate } from "@/lib/candidate-store";
import { resetEmployer } from "@/lib/employer-store";
import { createClient } from "@/lib/supabase/client";
import { NotificationsBell } from "./notifications-bell";
import { UserAvatar } from "./user-avatar";

type Props = {
  count: number;
  query: string;
  setQuery: (q: string) => void;
  onOpenPalette: () => void;
};

const noopSubscribe = () => () => {};

export function TopBar({ count, query, setQuery, onOpenPalette }: Props) {
  const mac = useSyncExternalStore(
    noopSubscribe,
    () => /Mac/.test(navigator.platform),
    () => true,
  );
  const user = useUser();
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        onOpenPalette();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onOpenPalette]);

  return (
    <header className="h-14 bg-white/85 backdrop-blur-md border border-[var(--border)] rounded-2xl sticky top-3 z-30 flex items-center pl-3 pr-2 sm:pl-4 sm:pr-3 gap-2 sm:gap-3 lg:gap-5 shadow-[0_1px_0_rgba(10,10,10,0.02)]">
      {/* Wordmark */}
      <Link href="/" className="flex items-center gap-2 shrink-0" aria-label="Monte Carlo Work — accueil">
        <span className="size-7 rounded-[9px] bg-foreground text-background flex items-center justify-center font-display text-[12.5px] font-semibold tracking-[-0.02em]">
          MC
        </span>
        <span className="font-display text-[17px] font-medium tracking-[-0.01em] hidden md:block whitespace-nowrap">
          Monte Carlo<span className="text-[var(--accent)]"> Work</span>
        </span>
      </Link>

      {/* Search */}
      <div className="flex-1 flex justify-center min-w-0">
        <button
          type="button"
          onClick={onOpenPalette}
          aria-label="Rechercher"
          className="wall-input w-full max-w-[560px] cursor-text"
        >
          <Search
            width={15}
            height={15}
            strokeWidth={2}
            className="text-[var(--tertiary-foreground)] shrink-0"
          />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onClick={(e) => e.stopPropagation()}
            placeholder="Rechercher…"
            className="flex-1 min-w-0 bg-transparent outline-none text-[13px] placeholder:text-[var(--tertiary-foreground)]"
          />
          <kbd className="hidden sm:inline text-[10.5px] font-mono text-[var(--tertiary-foreground)] bg-[var(--background-alt)] border border-[var(--border)] rounded-md px-1.5 py-px">
            {mac ? "⌘K" : "Ctrl K"}
          </kbd>
        </button>
      </div>

      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        {/* Live counter pill — caché < md */}
        <span className="wall-badge hidden md:inline-flex" data-tone="muted">
          <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
          <span className="font-mono">{count} offres en direct</span>
        </span>

        <nav className="hidden lg:flex items-center gap-1 text-[13px]">
          <Link
            href="/"
            className="px-2.5 py-1.5 rounded-lg text-foreground/75 hover:text-foreground hover:bg-foreground/5 transition-colors"
          >
            Offres
          </Link>
          <Link
            href="/entreprises"
            className="px-2.5 py-1.5 rounded-lg text-foreground/75 hover:text-foreground hover:bg-foreground/5 transition-colors"
          >
            Entreprises
          </Link>
          <Link
            href="/stories"
            className="px-2.5 py-1.5 rounded-lg text-foreground/75 hover:text-foreground hover:bg-foreground/5 transition-colors"
          >
            Magazine
          </Link>
        </nav>

        <NotificationsBell />

        {user ? (
          <div className="relative">
            <button
              type="button"
              onClick={() => setMenuOpen((v) => !v)}
              className="h-9 pl-1 pr-3 rounded-full border border-[var(--border)] bg-white hover:bg-[var(--background-alt)] transition-colors flex items-center gap-2"
            >
              <UserAvatar user={user} size={28} radius={999} />
              <span className="text-[12.5px] text-foreground/85 font-medium hidden md:inline">
                {user.name.split(" ")[0]}
              </span>
              <NavArrowDown
                width={11}
                height={11}
                strokeWidth={2.2}
                className="text-foreground/50"
              />
            </button>
            {menuOpen && (
              <div
                className="absolute right-0 top-11 z-30 bg-white border border-[var(--border)] rounded-xl shadow-[0_12px_32px_-8px_rgba(10,10,10,0.18)] py-1.5 min-w-[230px]"
                onMouseLeave={() => setMenuOpen(false)}
              >
                <div className="px-3 py-2 border-b border-[var(--border)] mb-1">
                  <div className="text-[13px] font-medium text-foreground">
                    {user.name}
                  </div>
                  <div className="text-[11.5px] text-muted-foreground truncate">
                    {user.email}
                  </div>
                  <div className="mt-1.5">
                    <span
                      className="wall-badge"
                      data-tone={user.role === "employer" ? "accent" : "muted"}
                    >
                      {user.role === "employer" ? (
                        <>
                          <Building /> Recruteur
                        </>
                      ) : (
                        <>
                          <UserIcon /> Candidat
                        </>
                      )}
                    </span>
                  </div>
                </div>

                {/* Mobile nav links (hidden on lg where topbar shows them) */}
                <div className="lg:hidden border-b border-[var(--border)] pb-1 mb-1">
                  <Link
                    href="/"
                    onClick={() => setMenuOpen(false)}
                    className="block px-3 py-1.5 text-[13px] text-foreground/85 hover:bg-[var(--background-alt)] hover:text-foreground rounded-lg mx-1"
                  >
                    Offres
                  </Link>
                  <Link
                    href="/entreprises"
                    onClick={() => setMenuOpen(false)}
                    className="block px-3 py-1.5 text-[13px] text-foreground/85 hover:bg-[var(--background-alt)] hover:text-foreground rounded-lg mx-1"
                  >
                    Entreprises
                  </Link>
                  <Link
                    href="/stories"
                    onClick={() => setMenuOpen(false)}
                    className="block px-3 py-1.5 text-[13px] text-foreground/85 hover:bg-[var(--background-alt)] hover:text-foreground rounded-lg mx-1"
                  >
                    Magazine
                  </Link>
                </div>

                <Link
                  href={user.role === "employer" ? "/recruteur" : "/candidat"}
                  onClick={() => setMenuOpen(false)}
                  className="block px-3 py-1.5 text-[13px] text-foreground/85 hover:bg-[var(--background-alt)] hover:text-foreground rounded-lg mx-1"
                >
                  Mon espace
                </Link>
                {user.email === "delachetg@gmail.com" && (
                  <Link
                    href="/admin"
                    onClick={() => setMenuOpen(false)}
                    className="block px-3 py-1.5 text-[13px] text-destructive font-medium hover:bg-destructive/10 rounded-lg mx-1"
                  >
                    Admin
                  </Link>
                )}
                {user.role === "employer" && (
                  <>
                    <Link
                      href="/recruteur/offres"
                      onClick={() => setMenuOpen(false)}
                      className="block px-3 py-1.5 text-[13px] text-foreground/85 hover:bg-[var(--background-alt)] hover:text-foreground rounded-lg mx-1"
                    >
                      Mes offres
                    </Link>
                    <Link
                      href="/recruteur/publier"
                      onClick={() => setMenuOpen(false)}
                      className="block px-3 py-1.5 text-[13px] text-foreground/85 hover:bg-[var(--background-alt)] hover:text-foreground rounded-lg mx-1"
                    >
                      Publier une offre
                    </Link>
                    <Link
                      href="/recruteur/candidats"
                      onClick={() => setMenuOpen(false)}
                      className="block px-3 py-1.5 text-[13px] text-foreground/85 hover:bg-[var(--background-alt)] hover:text-foreground rounded-lg mx-1"
                    >
                      Candidats
                    </Link>
                    <Link
                      href="/recruteur/equipe"
                      onClick={() => setMenuOpen(false)}
                      className="block px-3 py-1.5 text-[13px] text-foreground/85 hover:bg-[var(--background-alt)] hover:text-foreground rounded-lg mx-1"
                    >
                      Mon equipe
                    </Link>
                    <Link
                      href="/recruteur/entreprise"
                      onClick={() => setMenuOpen(false)}
                      className="block px-3 py-1.5 text-[13px] text-foreground/85 hover:bg-[var(--background-alt)] hover:text-foreground rounded-lg mx-1"
                    >
                      Ma fiche entreprise
                    </Link>
                  </>
                )}
                {user.role === "candidate" && (
                  <>
                    <Link
                      href="/candidat/profil"
                      onClick={() => setMenuOpen(false)}
                      className="block px-3 py-1.5 text-[13px] text-foreground/85 hover:bg-[var(--background-alt)] hover:text-foreground rounded-lg mx-1"
                    >
                      Mon profil
                    </Link>
                    <Link
                      href="/candidat/cv"
                      onClick={() => setMenuOpen(false)}
                      className="block px-3 py-1.5 text-[13px] text-foreground/85 hover:bg-[var(--background-alt)] hover:text-foreground rounded-lg mx-1"
                    >
                      Mon CV (PDF)
                    </Link>
                    <Link
                      href="/candidat/sauvegardes"
                      onClick={() => setMenuOpen(false)}
                      className="block px-3 py-1.5 text-[13px] text-foreground/85 hover:bg-[var(--background-alt)] hover:text-foreground rounded-lg mx-1"
                    >
                      Offres sauvegardées
                    </Link>
                  </>
                )}
                <button
                  type="button"
                  onClick={() => {
                    resetCandidate();
                    resetEmployer();
                    signOut();
                    // Deconnexion Supabase aussi
                    createClient().auth.signOut();
                    setMenuOpen(false);
                  }}
                  className="w-full text-left px-3 py-1.5 text-[13px] text-foreground/70 hover:bg-[var(--background-alt)] hover:text-foreground rounded-lg mx-1 flex items-center gap-2 mt-1 border-t border-[var(--border)] pt-2"
                  style={{ width: "calc(100% - 8px)" }}
                >
                  <LogOut width={12} height={12} strokeWidth={2} />
                  Se déconnecter
                </button>
              </div>
            )}
          </div>
        ) : (
          <Link
            href="/connexion"
            className="h-8 px-3 sm:px-3.5 rounded-full bg-foreground text-background text-[12.5px] font-medium hover:bg-foreground/85 transition-colors flex items-center whitespace-nowrap"
          >
            <span className="hidden sm:inline">Se connecter</span>
            <span className="sm:hidden">Connexion</span>
          </Link>
        )}
      </div>
    </header>
  );
}
