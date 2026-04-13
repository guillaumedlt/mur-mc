"use client";

import { useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Sparks } from "iconoir-react";
import { allJobs } from "@/lib/data";
import { useAuthLoading, useUser } from "@/lib/auth";
import { ensureOwnership } from "@/lib/employer-store";
import { Shell } from "../shell";
import { EmployerTabs } from "./employer-tabs";

type Props = {
  children: React.ReactNode;
};

/**
 * Wrapper standard pour toutes les pages /recruteur/* :
 * - Guard role (redirect si pas connecte ou pas employer)
 * - Si pas de companyId → redirect onboarding
 * - TopBar floating + tabs nav + footer (via Shell)
 */
export function EmployerShell({ children }: Props) {
  const user = useUser();
  const loading = useAuthLoading();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!loading && user === null) {
      const t = window.setTimeout(() => router.replace("/connexion"), 100);
      return () => window.clearTimeout(t);
    }
  }, [user, loading, router]);

  // Pendant le sync Supabase
  if (loading) {
    return (
      <Shell jobs={allJobs}>
        <div className="max-w-[1100px] mx-auto bg-white border border-[var(--border)] rounded-2xl p-12 flex flex-col items-center justify-center gap-4">
          <span className="size-6 border-2 border-foreground/20 border-t-foreground rounded-full animate-spin" />
          <p className="text-[12px] text-muted-foreground">Chargement...</p>
          <Link
            href="/deconnexion"
            className="text-[11px] text-foreground/40 hover:text-foreground transition-colors"
          >
            Se deconnecter
          </Link>
        </div>
      </Shell>
    );
  }

  if (!user || user.role !== "employer") {
    return (
      <Shell jobs={allJobs}>
        <div className="max-w-[1100px] mx-auto bg-white border border-[var(--border)] rounded-2xl p-12 text-center">
          <p className="font-display italic text-[18px] text-foreground">
            Connecte-toi côté recruteur pour accéder à cet espace.
          </p>
          <Link
            href="/connexion"
            className="inline-flex h-10 mt-5 px-5 rounded-full bg-foreground text-background text-[13px] items-center"
          >
            Se connecter
          </Link>
        </div>
      </Shell>
    );
  }

  // Isoler le store par compte : reset si les donnees appartiennent a un autre user
  ensureOwnership(user.id);

  // Employer connecte mais pas encore d'entreprise → onboarding
  if (!user.companyId && pathname !== "/recruteur/onboarding") {
    return (
      <Shell jobs={allJobs}>
        <div className="max-w-[760px] mx-auto bg-white border border-[var(--border)] rounded-2xl p-12 text-center">
          <span className="size-14 rounded-2xl bg-[var(--accent)]/10 text-[var(--accent)] inline-flex items-center justify-center mb-4">
            <Sparks width={24} height={24} strokeWidth={1.8} />
          </span>
          <h2 className="font-display text-[24px] tracking-[-0.015em] text-foreground">
            Bienvenue sur Mur.mc
          </h2>
          <p className="text-[13.5px] text-muted-foreground mt-2 max-w-md mx-auto">
            Pour commencer, créez votre fiche entreprise. Ça prend moins de 2 minutes et vous pourrez ensuite publier votre première offre gratuitement.
          </p>
          <Link
            href="/recruteur/onboarding"
            className="inline-flex h-10 mt-5 px-5 rounded-full bg-foreground text-background text-[13px] font-medium items-center gap-2"
          >
            <Sparks width={14} height={14} strokeWidth={2} />
            Créer mon entreprise
          </Link>
        </div>
      </Shell>
    );
  }

  return (
    <Shell jobs={allJobs}>
      <EmployerTabs />
      {children}
    </Shell>
  );
}
