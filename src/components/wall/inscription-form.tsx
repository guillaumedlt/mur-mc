"use client";

import { useState } from "react";
import { Building, Search } from "iconoir-react";
import { ConnexionForm } from "./connexion-form";
import { EmployerContactForm } from "./employer-contact-form";

type Tab = "candidate" | "employer";

export function InscriptionForm() {
  const [tab, setTab] = useState<Tab>("candidate");

  return (
    <div className="bg-white border border-[var(--border)] rounded-2xl px-5 sm:px-7 lg:px-9 py-6 lg:py-8">
      {/* Toggle */}
      <div className="flex rounded-full border border-[var(--border)] bg-[var(--background-alt)]/60 p-1 mb-6">
        <button
          type="button"
          onClick={() => setTab("candidate")}
          className={`flex-1 h-10 rounded-full text-[13px] font-medium transition-colors inline-flex items-center justify-center gap-2 ${
            tab === "candidate"
              ? "bg-foreground text-background"
              : "text-foreground/60 hover:text-foreground"
          }`}
        >
          <Search width={14} height={14} strokeWidth={2} />
          Je cherche un emploi
        </button>
        <button
          type="button"
          onClick={() => setTab("employer")}
          className={`flex-1 h-10 rounded-full text-[13px] font-medium transition-colors inline-flex items-center justify-center gap-2 ${
            tab === "employer"
              ? "bg-foreground text-background"
              : "text-foreground/60 hover:text-foreground"
          }`}
        >
          <Building width={14} height={14} strokeWidth={2} />
          Je recrute
        </button>
      </div>

      {tab === "candidate" ? (
        <>
          <h1 className="font-display text-[24px] sm:text-[28px] tracking-[-0.015em] text-foreground">
            Creer mon compte
          </h1>
          <p className="text-[13.5px] text-muted-foreground mt-2 mb-6">
            Postulez aux offres de Monaco en un clic.
          </p>
          <ConnexionForm mode="signup" compact />
        </>
      ) : (
        <>
          <h1 className="font-display text-[24px] sm:text-[28px] tracking-[-0.015em] text-foreground">
            Recruter sur Monte Carlo Work
          </h1>
          <p className="text-[13.5px] text-muted-foreground mt-2 mb-6">
            Remplissez ce formulaire et nous activerons votre espace sous 24h.
          </p>
          <EmployerContactForm />
        </>
      )}
    </div>
  );
}
