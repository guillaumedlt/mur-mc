"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { allJobs } from "@/lib/data";
import { useAuthLoading, useUser } from "@/lib/auth";
import { Shell } from "../shell";
import { EmployerTabs } from "./employer-tabs";

type Props = {
  children: React.ReactNode;
};

/**
 * Wrapper standard pour toutes les pages /recruteur/* :
 * - Guard role (redirect si pas connecte ou pas employer)
 * - TopBar floating + tabs nav + footer (via Shell)
 */
export function EmployerShell({ children }: Props) {
  const user = useUser();
  const loading = useAuthLoading();
  const router = useRouter();

  useEffect(() => {
    // Ne redirect que si le sync est termine ET pas de user
    if (!loading && user === null) {
      const t = window.setTimeout(() => router.replace("/connexion"), 100);
      return () => window.clearTimeout(t);
    }
  }, [user, loading, router]);

  // Pendant le sync Supabase, afficher un skeleton
  if (loading) {
    return (
      <Shell jobs={allJobs}>
        <div className="max-w-[1100px] mx-auto bg-white border border-[var(--border)] rounded-2xl p-12 flex items-center justify-center">
          <span className="size-6 border-2 border-foreground/20 border-t-foreground rounded-full animate-spin" />
        </div>
      </Shell>
    );
  }

  if (!user || user.role !== "employer") {
    return (
      <Shell jobs={allJobs}>
        <div className="max-w-[1100px] mx-auto bg-white border border-[var(--border)] rounded-2xl p-12 text-center">
          <p className="font-display italic text-[18px] text-foreground">
            Connecte-toi cote recruteur pour acceder a cet espace.
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
