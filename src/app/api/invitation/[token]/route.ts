import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * GET /api/invitation/[token]
 *
 * Charge une team_invitation par son token via service_role (la RLS sur
 * team_invitations bloque les non-membres, ce qui est le cas du destinataire
 * d'une invitation puisqu'il n'a pas encore de profile lie a la company).
 *
 * Retourne les infos publiques minimales (email, company name, role) pour
 * permettre au formulaire /invitation/[token] de s'afficher.
 *
 * 404 si l'invitation est introuvable, expiree ou deja consommee.
 */
export async function GET(
  _request: Request,
  context: { params: Promise<{ token: string }> },
) {
  const { token } = await context.params;
  if (!token || token.length > 200) {
    return NextResponse.json({ error: "Token invalide" }, { status: 400 });
  }

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("team_invitations")
    .select(
      "id, email, team_role, company_id, status, expires_at, companies(name, slug)",
    )
    .eq("token", token)
    .maybeSingle();

  if (error) {
    console.error("[invitation.lookup]", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
  if (!data) {
    return NextResponse.json({ error: "Invitation introuvable" }, { status: 404 });
  }
  if (data.status !== "pending") {
    return NextResponse.json(
      { error: `Invitation deja ${data.status}` },
      { status: 410 },
    );
  }
  if (data.expires_at && new Date(data.expires_at).getTime() < Date.now()) {
    return NextResponse.json({ error: "Invitation expiree" }, { status: 410 });
  }

  const co = data.companies as
    | { name: string; slug: string }
    | { name: string; slug: string }[]
    | null;
  const company = Array.isArray(co) ? co[0] : co;

  return NextResponse.json({
    id: data.id,
    email: data.email,
    teamRole: data.team_role,
    companyId: data.company_id,
    companyName: company?.name ?? "Entreprise",
    companySlug: company?.slug ?? "",
  });
}
