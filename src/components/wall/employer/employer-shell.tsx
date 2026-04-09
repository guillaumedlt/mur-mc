"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { allJobs } from "@/lib/data";
import { useUser } from "@/lib/auth";
import { seedDemoEmployer } from "@/lib/employer-store";
import { Shell } from "../shell";
import { EmployerTabs } from "./employer-tabs";

type Props = {
  children: React.ReactNode;
};

/**
 * Wrapper standard pour toutes les pages /recruteur/* :
 * - Guard rôle (redirect si pas connecté ou pas employer)
 * - Seed démo idempotent au mount (utile au login démo et à la migration)
 * - TopBar floating + tabs nav + footer (via Shell)
 */
export function EmployerShell({ children }: Props) {
  const user = useUser();
  const router = useRouter();

  // Seed démo : appel side-effect uniquement, pas de setState React local.
  // Conforme à react-hooks/set-state-in-effect (le store fait son propre emit).
  useEffect(() => {
    if (user?.role === "employer" && user.companyId) {
      seedDemoEmployer({
        companyId: user.companyId,
        recruiterName: user.name,
      });
    }
  }, [user]);

  useEffect(() => {
    if (user === null) {
      const t = window.setTimeout(() => router.replace("/connexion"), 50);
      return () => window.clearTimeout(t);
    }
  }, [user, router]);

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

  return (
    <Shell jobs={allJobs}>
      <EmployerTabs />
      {children}
    </Shell>
  );
}
