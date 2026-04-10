"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { signOut } from "@/lib/auth";
import { resetCandidate } from "@/lib/candidate-store";
import { resetEmployer } from "@/lib/employer-store";
import { createClient } from "@/lib/supabase/client";

/**
 * Page de deconnexion : clear tout (Supabase + localStorage) et redirige.
 * Accessible directement via /deconnexion pour forcer un logout propre.
 */
export default function DeconnexionPage() {
  const router = useRouter();

  useEffect(() => {
    const logout = async () => {
      // Clear localStorage stores
      resetCandidate();
      resetEmployer();
      signOut();

      // Clear Supabase session
      const supabase = createClient();
      await supabase.auth.signOut();

      // Redirect to home
      router.replace("/");
    };
    logout();
  }, [router]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center">
        <span className="size-6 border-2 border-foreground/20 border-t-foreground rounded-full animate-spin inline-block" />
        <p className="text-[13px] text-muted-foreground mt-3">
          Deconnexion en cours...
        </p>
      </div>
    </div>
  );
}
