import type { Metadata } from "next";
import { Suspense } from "react";

import { Shell } from "@/components/wall/shell";
import { ConnexionForm } from "@/components/wall/connexion-form";

export const metadata: Metadata = {
  title: "Se connecter",
  description:
    "Connectez-vous à Monte Carlo Work pour postuler aux offres monégasques ou publier les vôtres.",
  alternates: { canonical: "/connexion" },
  robots: { index: false, follow: true },
};

export default function ConnexionPage() {
  return (
    <Shell jobs={[]}>
      <div className="max-w-[1100px] mx-auto">
        <Suspense>
          <ConnexionForm mode="signin" />
        </Suspense>
      </div>
    </Shell>
  );
}
