import type { Metadata } from "next";
import { allJobs } from "@/lib/data";
import { Shell } from "@/components/wall/shell";
import { ConnexionForm } from "@/components/wall/connexion-form";

export const metadata: Metadata = {
  title: "Se connecter",
  description:
    "Connectez-vous à Mur.mc pour postuler aux offres monégasques ou publier les vôtres.",
  alternates: { canonical: "/connexion" },
  robots: { index: false, follow: true },
};

export default function ConnexionPage() {
  return (
    <Shell jobs={allJobs}>
      <div className="max-w-[1100px] mx-auto">
        <ConnexionForm mode="signin" />
      </div>
    </Shell>
  );
}
