"use client";

import { useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  type AuthUser,
  markAuthSynced,
  signIn,
  signOut,
  useUser,
} from "@/lib/auth";

/**
 * Composant invisible qui synchronise la session Supabase Auth
 * dans le store localStorage (lib/auth.ts).
 *
 * Quand un user se connecte via Supabase (email/password), ce composant
 * detecte la session et appelle signIn() du store local pour que tous
 * les composants (useUser(), EmployerShell, CandidateDashboard…) voient
 * l'utilisateur connecte.
 *
 * Doit etre place dans le layout racine, au-dessus de tous les composants
 * qui utilisent useUser().
 */
export function SupabaseAuthSync() {
  const localUser = useUser();

  useEffect(() => {
    const supabase = createClient();

    // Sync initiale : si le store local est deja rempli (pre-sync du login form),
    // on marque comme synced immediatement et on skip les requetes.
    const syncSession = async () => {
      // Si le store local est deja rempli, on est bon — juste marquer synced
      if (localUser) {
        markAuthSynced();
        return;
      }

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        const role = (user.user_metadata?.role as "candidate" | "employer") ?? "candidate";
        const fullName =
          user.user_metadata?.full_name ??
          user.email?.split("@")[0] ??
          "Utilisateur";
        const nameParts = fullName.split(" ").filter(Boolean);
        const initials =
          nameParts.length >= 2
            ? `${nameParts[0][0]}${nameParts[nameParts.length - 1][0]}`.toUpperCase()
            : fullName.slice(0, 2).toUpperCase();

        const authUser: AuthUser = {
          id: user.id,
          name: fullName,
          email: user.email ?? "",
          role,
          initials,
          avatarColor: role === "employer" ? "#7c1d2c" : "#1C3D5A",
        };

        // Pour les employers, charger company_id + name en parallele
        if (role === "employer") {
          const { data: profile } = await supabase
            .from("profiles")
            .select("company_id")
            .eq("id", user.id)
            .single();

          if (profile?.company_id) {
            authUser.companyId = profile.company_id;
            const { data: company } = await supabase
              .from("companies")
              .select("name")
              .eq("id", profile.company_id)
              .single();
            if (company) authUser.companyName = company.name;
          }
        }

        signIn(authUser);
      } else {
        if (localUser) signOut();
        markAuthSynced();
      }
    };

    syncSession();

    // 2. Ecouter les changements d'auth (login, logout, token refresh)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === "SIGNED_IN" && session?.user) {
        const user = session.user;
        const role = (user.user_metadata?.role as "candidate" | "employer") ?? "candidate";
        const fullName =
          user.user_metadata?.full_name ??
          user.email?.split("@")[0] ??
          "Utilisateur";
        const nameParts = fullName.split(" ").filter(Boolean);
        const initials =
          nameParts.length >= 2
            ? `${nameParts[0][0]}${nameParts[nameParts.length - 1][0]}`.toUpperCase()
            : fullName.slice(0, 2).toUpperCase();

        const authUser: AuthUser = {
          id: user.id,
          name: fullName,
          email: user.email ?? "",
          role,
          initials,
          avatarColor: role === "employer" ? "#7c1d2c" : "#1C3D5A",
        };

        if (role === "employer") {
          const { data: profile } = await supabase
            .from("profiles")
            .select("company_id")
            .eq("id", user.id)
            .single();

          if (profile?.company_id) {
            authUser.companyId = profile.company_id;

            const { data: company } = await supabase
              .from("companies")
              .select("name")
              .eq("id", profile.company_id)
              .single();

            if (company) authUser.companyName = company.name;
          }
        }

        signIn(authUser);
      } else if (event === "SIGNED_OUT") {
        signOut();
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return null;
}
