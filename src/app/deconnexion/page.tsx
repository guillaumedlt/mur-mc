"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { signOut } from "@/lib/auth";
import { resetCandidate } from "@/lib/candidate-store";
import { resetEmployer } from "@/lib/employer-store";
import { createClient } from "@/lib/supabase/client";

export default function DeconnexionPage() {
  const router = useRouter();
  const [done, setDone] = useState(false);

  useEffect(() => {
    // Clear local stores immediatement (synchrone)
    resetCandidate();
    resetEmployer();
    signOut();

    // Clear Supabase session (async mais on n'attend pas)
    createClient().auth.signOut().finally(() => {
      setDone(true);
      router.replace("/");
    });
  }, [router]);

  // Fallback si le signOut Supabase prend trop longtemps
  useEffect(() => {
    const t = window.setTimeout(() => {
      if (!done) router.replace("/");
    }, 2000);
    return () => window.clearTimeout(t);
  }, [done, router]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <span className="size-6 border-2 border-foreground/20 border-t-foreground rounded-full animate-spin" />
    </div>
  );
}
