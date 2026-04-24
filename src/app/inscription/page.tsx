import type { Metadata } from "next";
import { Suspense } from "react";
import { Shell } from "@/components/wall/shell";
import { ConnexionForm } from "@/components/wall/connexion-form";
import { EmployerContactForm } from "@/components/wall/employer-contact-form";

export const metadata: Metadata = {
  title: "Creer un compte — Mur.mc",
  description:
    "Candidats : creez votre compte pour postuler. Recruteurs : demandez votre espace employeur.",
  alternates: { canonical: "/inscription" },
  robots: { index: false, follow: true },
};

export default function InscriptionPage() {
  return (
    <Shell jobs={[]}>
      <div className="max-w-[1100px] mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 items-start">
          {/* Candidat — inscription directe */}
          <div className="bg-white border border-[var(--border)] rounded-2xl px-5 sm:px-7 lg:px-9 py-6 lg:py-8">
            <p className="ed-label-sm text-[var(--accent)]">Candidat</p>
            <h1 className="font-display text-[24px] sm:text-[28px] tracking-[-0.015em] text-foreground mt-1">
              Creer mon compte
            </h1>
            <p className="text-[13.5px] text-muted-foreground mt-2 mb-6">
              Postulez aux offres de Monaco en un clic.
            </p>
            <Suspense>
              <ConnexionForm mode="signup" />
            </Suspense>
          </div>

          {/* Recruteur — formulaire de contact */}
          <div className="bg-white border border-[var(--border)] rounded-2xl px-5 sm:px-7 lg:px-9 py-6 lg:py-8">
            <p className="ed-label-sm text-[var(--accent)]">Recruteur</p>
            <h2 className="font-display text-[24px] sm:text-[28px] tracking-[-0.015em] text-foreground mt-1">
              Recruter sur Mur.mc
            </h2>
            <p className="text-[13.5px] text-muted-foreground mt-2 mb-6">
              Remplissez ce formulaire et nous activerons votre espace sous 24h.
            </p>
            <EmployerContactForm />
          </div>
        </div>
      </div>
    </Shell>
  );
}
