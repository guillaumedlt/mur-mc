"use client";

import { Sparks } from "iconoir-react";
import type { Job } from "@/lib/data";
import { useUser } from "@/lib/auth";
import {
  matchScore,
  matchTier,
  profileCompletion,
  useCandidate,
} from "@/lib/candidate-store";

type Props = { job: Job; size?: "sm" | "md" };

/**
 * Affiche un score de matching offre/profil colore par tier.
 * Visible uniquement si user candidat avec profil >= 30% complet.
 *
 * Tiers :
 * - 80+ "excellent" → vert
 * - 60-79 "good" → accent bleu
 * - 40-59 "fair" → gris (affiché seulement en size="md")
 * - <40 "low" → masqué
 */
export function MatchPill({ job, size = "sm" }: Props) {
  const user = useUser();
  const { profile } = useCandidate();

  if (!user || user.role !== "candidate") return null;
  if (profileCompletion(profile) < 30) return null;

  const score = matchScore(job, profile);
  const tier = matchTier(score);

  // En taille sm (card), on masque les faibles et moyens
  if (size === "sm" && (tier === "low" || tier === "fair")) return null;
  // En taille md (hero), on masque les faibles
  if (size === "md" && tier === "low") return null;

  const tone =
    tier === "excellent" ? "fresh" : tier === "good" ? "accent" : "muted";

  if (size === "md") {
    return (
      <div
        className={`inline-flex items-center gap-2 h-7 px-3 rounded-full border ${
          tier === "excellent"
            ? "bg-[oklch(0.92_0.12_145_/_0.15)] border-[oklch(0.55_0.15_145_/_0.25)] text-[oklch(0.42_0.13_145)]"
            : tier === "good"
              ? "bg-[var(--accent)]/[0.08] border-[var(--accent)]/20 text-[var(--accent)]"
              : "bg-[var(--background-alt)] border-[var(--border)] text-foreground/65"
        }`}
      >
        <Sparks width={11} height={11} strokeWidth={2.4} />
        <span className="text-[11.5px] font-medium tabular-nums">
          {score}% match
        </span>
      </div>
    );
  }

  return (
    <span className="wall-badge" data-tone={tone}>
      <Sparks /> {score}%
    </span>
  );
}

/**
 * Hook utilitaire : retourne le score pour un job donné.
 * Retourne 0 si pas de candidat connecté ou profil incomplet.
 */
export function useMatchScore(job: Job): number {
  const user = useUser();
  const { profile } = useCandidate();
  if (!user || user.role !== "candidate") return 0;
  if (profileCompletion(profile) < 30) return 0;
  return matchScore(job, profile);
}
