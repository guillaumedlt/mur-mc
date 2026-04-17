import { NextResponse } from "next/server";
import type { SupabaseClient } from "@supabase/supabase-js";

export type AuthorizedEmployer = {
  userId: string;
  companyId: string;
  teamRole: "admin" | "recruiter" | "viewer";
  role: "employer";
};

type AuthzResult =
  | { ok: true; employer: AuthorizedEmployer }
  | { ok: false; response: NextResponse };

/**
 * Verifie qu'une requete API provient d'un employer authentifie et rattache
 * a une company. Optionnellement exige un team_role minimum.
 *
 * A appeler depuis toute API route qui mute des donnees ATS / equipe / company.
 *
 * @param supabase  Le client server (cookies-based, anon key) — lit l'auth de l'appelant
 * @param require   team_role minimum requis ("admin", "recruiter" ou undefined)
 */
export async function getAuthorizedEmployer(
  supabase: SupabaseClient,
  require?: "admin" | "recruiter",
): Promise<AuthzResult> {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      ok: false,
      response: NextResponse.json({ error: "Non authentifie" }, { status: 401 }),
    };
  }

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("role, team_role, company_id")
    .eq("id", user.id)
    .single();

  if (error || !profile) {
    return {
      ok: false,
      response: NextResponse.json({ error: "Profil introuvable" }, { status: 403 }),
    };
  }

  if (profile.role !== "employer") {
    return {
      ok: false,
      response: NextResponse.json({ error: "Acces reserve aux recruteurs" }, { status: 403 }),
    };
  }

  if (!profile.company_id) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: "Aucune entreprise rattachee au profil" },
        { status: 403 },
      ),
    };
  }

  const teamRole = (profile.team_role ?? "viewer") as "admin" | "recruiter" | "viewer";

  if (require === "admin" && teamRole !== "admin") {
    return {
      ok: false,
      response: NextResponse.json(
        { error: "Action reservee aux administrateurs de l'equipe" },
        { status: 403 },
      ),
    };
  }

  if (require === "recruiter" && teamRole === "viewer") {
    return {
      ok: false,
      response: NextResponse.json(
        { error: "Action reservee aux recruteurs (lecture seule)" },
        { status: 403 },
      ),
    };
  }

  return {
    ok: true,
    employer: {
      userId: user.id,
      companyId: profile.company_id,
      teamRole,
      role: "employer",
    },
  };
}
