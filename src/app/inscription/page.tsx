import type { Metadata } from "next";
import { allJobs } from "@/lib/data";
import { Shell } from "@/components/wall/shell";
import { ConnexionForm } from "@/components/wall/connexion-form";

export const metadata: Metadata = {
  title: "Créer un compte",
  description:
    "Créez votre compte Mur.mc pour postuler aux offres monégasques ou recruter sur la Principauté.",
  alternates: { canonical: "/inscription" },
  robots: { index: false, follow: true },
};

export default function InscriptionPage() {
  return (
    <Shell jobs={allJobs}>
      <div className="max-w-[1100px] mx-auto">
        <ConnexionForm mode="signup" />
      </div>
    </Shell>
  );
}
