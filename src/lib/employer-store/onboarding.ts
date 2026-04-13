import type { OnboardingState, OnboardingStep } from "./types";
import { cached, setCached, ensureLoaded, persist, emit } from "./core";

/* ─── Onboarding ─────────────────────────────────────────────────── */

export const ONBOARDING_STEPS: Array<{
  key: OnboardingStep;
  label: string;
  description: string;
}> = [
  {
    key: "company_created",
    label: "Creer votre entreprise",
    description: "Nom, secteur, taille et localisation de votre societe.",
  },
  {
    key: "profile_completed",
    label: "Completer la fiche entreprise",
    description:
      "Description, positionnement, culture, avantages — ce que les candidats voient.",
  },
  {
    key: "first_job_published",
    label: "Publier votre premiere offre",
    description: "Une seule offre suffit pour commencer a recevoir des candidatures.",
  },
  {
    key: "team_invited",
    label: "Inviter votre equipe",
    description: "Ajoutez vos collegues pour gerer les candidatures ensemble.",
  },
  {
    key: "company_page_customized",
    label: "Personnaliser votre page publique",
    description:
      "Photo de couverture, tagline — rendez votre fiche attractive.",
  },
];

export function completeOnboardingStep(step: OnboardingStep): void {
  ensureLoaded();
  if (cached.onboarding.completed.includes(step)) return;
  setCached({
    ...cached,
    onboarding: {
      ...cached.onboarding,
      completed: [...cached.onboarding.completed, step],
    },
  });
  persist();
  emit();
}

export function skipOnboarding(): void {
  ensureLoaded();
  setCached({
    ...cached,
    onboarding: {
      ...cached.onboarding,
      skippedAt: new Date().toISOString(),
    },
  });
  persist();
  emit();
}

export function onboardingProgress(): {
  done: number;
  total: number;
  percent: number;
  isComplete: boolean;
} {
  ensureLoaded();
  const done = cached.onboarding.completed.length;
  const total = ONBOARDING_STEPS.length;
  return {
    done,
    total,
    percent: Math.round((done / total) * 100),
    isComplete: done >= total,
  };
}

/**
 * Scan IA d'un domaine d'entreprise via la route /api/ai/scan-company.
 * Fallback generique si l'API echoue.
 */
export async function scanCompanyDomain(domain: string): Promise<NonNullable<OnboardingState["aiSuggestion"]>> {
  try {
    const res = await fetch("/api/ai/scan-company", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ domain }),
    });

    if (res.ok) {
      const data = await res.json();
      const result: NonNullable<OnboardingState["aiSuggestion"]> = {
        description: data.description ?? undefined,
        positioning: data.positioning ?? undefined,
        sector: data.sector ?? undefined,
        size: data.size ?? undefined,
      };

      ensureLoaded();
      setCached({
        ...cached,
        onboarding: {
          ...cached.onboarding,
          scannedDomain: domain,
          aiSuggestion: result,
        },
      });
      persist();
      emit();
      return result;
    }
  } catch {
    // Fallback silencieux
  }

  const generic: NonNullable<OnboardingState["aiSuggestion"]> = {
    description: `Entreprise basee a Monaco, ${domain} opere dans un environnement international exigeant.`,
    positioning: "Acteur monegasque reconnu dans son secteur.",
    sector: "Autre",
    size: "10-50",
  };

  ensureLoaded();
  setCached({
    ...cached,
    onboarding: {
      ...cached.onboarding,
      scannedDomain: domain,
      aiSuggestion: generic,
    },
  });
  persist();
  emit();
  return generic;
}
