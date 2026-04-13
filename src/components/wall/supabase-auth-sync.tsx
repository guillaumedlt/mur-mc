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
import { updateProfile, useCandidate } from "@/lib/candidate-store";

/**
 * Composant invisible : sync la session Supabase dans le store localStorage.
 * Place dans le layout racine. Ne fait qu'un seul appel API (getUser) au mount.
 * Si le store local est deja rempli (pre-sync du login form), skip tout.
 */
export function SupabaseAuthSync() {
  const localUser = useUser();
  const { profile } = useCandidate();

  useEffect(() => {
    // Si le store local est deja rempli, on est bon
    if (localUser) {
      markAuthSynced();
      return;
    }

    const supabase = createClient();

    const sync = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        markAuthSynced();
        return;
      }

      const role =
        (user.user_metadata?.role as "candidate" | "employer") ?? "candidate";
      const fullName =
        user.user_metadata?.full_name ??
        user.email?.split("@")[0] ??
        "Utilisateur";
      const parts = fullName.split(" ").filter(Boolean);

      const authUser: AuthUser = {
        id: user.id,
        name: fullName,
        email: user.email ?? "",
        role,
        initials:
          parts.length >= 2
            ? `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase()
            : fullName.slice(0, 2).toUpperCase(),
        avatarColor: role === "employer" ? "#7c1d2c" : "#1C3D5A",
      };

      // Pour les employers, charger company ou detecter invitation
      if (role === "employer") {
        const { data } = await supabase
          .from("profiles")
          .select("company_id, companies(name)")
          .eq("id", user.id)
          .single();
        if (data?.company_id) {
          authUser.companyId = data.company_id;
          const companies = data.companies as unknown;
          if (companies && typeof companies === "object" && "name" in (companies as Record<string, unknown>)) {
            authUser.companyName = (companies as { name: string }).name;
          }
        } else if (user.email) {
          // Pas de company — verifier invitation en attente
          const { data: inv } = await supabase
            .from("team_invitations")
            .select("id, company_id, team_role, companies(name)")
            .eq("email", user.email)
            .eq("status", "pending")
            .limit(1)
            .single();
          if (inv?.company_id) {
            await supabase.from("profiles").update({
              company_id: inv.company_id,
              team_role: inv.team_role,
            }).eq("id", user.id);
            await supabase.from("team_invitations").update({ status: "accepted" }).eq("id", inv.id);
            authUser.companyId = inv.company_id;
            const c = inv.companies as unknown;
            if (c && typeof c === "object" && "name" in (c as Record<string, unknown>)) {
              authUser.companyName = (c as { name: string }).name;
            }
          }
        }
      }

      signIn(authUser);

      // Init le profil candidat si vide
      if (role === "candidate" && !profile.fullName) {
        updateProfile({
          fullName: authUser.name,
          email: authUser.email,
        });
      }
    };

    sync();

    // Ecouter les changements (logout depuis un autre onglet)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_OUT") {
        signOut();
      }
    });

    return () => subscription.unsubscribe();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return null;
}
