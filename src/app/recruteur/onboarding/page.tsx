import type { Metadata } from "next";

import { Shell } from "@/components/wall/shell";
import { OnboardingWizard } from "@/components/wall/employer/onboarding-wizard";

export const metadata: Metadata = {
  title: "Configuration du compte recruteur",
  description: "Configurez votre espace recruteur sur Mur.mc.",
  alternates: { canonical: "/recruteur/onboarding" },
  robots: { index: false, follow: false },
};

export default function OnboardingPage() {
  return (
    <Shell jobs={[]}>
      <OnboardingWizard />
    </Shell>
  );
}
