import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getAuthorizedEmployer } from "@/lib/supabase/authz";

/**
 * PATCH /api/team/member
 * Body: { memberId: string, teamRole: "admin"|"recruiter"|"viewer" }
 *
 * Change le team_role d'un membre de l'equipe. Reserve aux admins.
 *
 * Regles :
 *  - memberId doit appartenir a la meme company que l'appelant
 *  - on ne peut pas rtrograder le DERNIER admin (y compris soi-meme)
 */
export async function PATCH(request: Request) {
  const supabase = await createClient();
  const authz = await getAuthorizedEmployer(supabase, "admin");
  if (!authz.ok) return authz.response;
  const { companyId } = authz.employer;

  const body = await request.json().catch(() => null);
  const memberId: string | undefined = body?.memberId;
  const teamRole: "admin" | "recruiter" | "viewer" | undefined = body?.teamRole;

  if (!memberId) {
    return NextResponse.json({ error: "memberId requis" }, { status: 400 });
  }
  if (!teamRole || !["admin", "recruiter", "viewer"].includes(teamRole)) {
    return NextResponse.json({ error: "team_role invalide" }, { status: 400 });
  }

  const admin = createAdminClient();

  // Verifier que le membre cible est bien dans la meme company
  const { data: target } = await admin
    .from("profiles")
    .select("id, company_id, team_role")
    .eq("id", memberId)
    .maybeSingle();

  if (!target || target.company_id !== companyId) {
    return NextResponse.json(
      { error: "Membre introuvable dans votre equipe" },
      { status: 404 },
    );
  }

  // Empecher la retrogradation du dernier admin
  if (target.team_role === "admin" && teamRole !== "admin") {
    const { count } = await admin
      .from("profiles")
      .select("id", { count: "exact", head: true })
      .eq("company_id", companyId)
      .eq("team_role", "admin");

    if ((count ?? 0) <= 1) {
      return NextResponse.json(
        { error: "Impossible de retrograder le dernier administrateur de l'equipe" },
        { status: 409 },
      );
    }
  }

  const { error } = await admin
    .from("profiles")
    .update({ team_role: teamRole })
    .eq("id", memberId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}

/**
 * DELETE /api/team/member?id=<memberId>
 *
 * Retire un membre de la company (profile.company_id = null, team_role = null).
 * Reserve aux admins. Le dernier admin ne peut pas se retirer lui-meme.
 */
export async function DELETE(request: Request) {
  const supabase = await createClient();
  const authz = await getAuthorizedEmployer(supabase, "admin");
  if (!authz.ok) return authz.response;
  const { companyId } = authz.employer;

  const url = new URL(request.url);
  const memberId = url.searchParams.get("id");

  if (!memberId) {
    return NextResponse.json({ error: "id requis" }, { status: 400 });
  }

  const admin = createAdminClient();

  const { data: target } = await admin
    .from("profiles")
    .select("id, company_id, team_role")
    .eq("id", memberId)
    .maybeSingle();

  if (!target || target.company_id !== companyId) {
    return NextResponse.json(
      { error: "Membre introuvable dans votre equipe" },
      { status: 404 },
    );
  }

  // Empecher le retrait du dernier admin
  if (target.team_role === "admin") {
    const { count } = await admin
      .from("profiles")
      .select("id", { count: "exact", head: true })
      .eq("company_id", companyId)
      .eq("team_role", "admin");

    if ((count ?? 0) <= 1) {
      return NextResponse.json(
        { error: "Impossible de retirer le dernier administrateur de l'equipe" },
        { status: 409 },
      );
    }
  }

  const { error } = await admin
    .from("profiles")
    .update({ company_id: null, team_role: null })
    .eq("id", memberId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
