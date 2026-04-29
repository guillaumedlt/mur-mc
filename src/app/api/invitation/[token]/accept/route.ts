import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * POST /api/invitation/[token]/accept
 *
 * Finalise l'acceptation d'une invitation team. Le client doit avoir
 * AUTHENTIFIE l'user (signUp ou signIn) avant d'appeler cette route :
 * la route verifie que l'auth.user.email == invitation.email puis :
 *   - update profile avec company_id + team_role + full_name (service_role
 *     pour bypass le trigger prevent_profile_self_escalation)
 *   - update team_invitations.status = 'accepted' (service_role pour bypass
 *     la RLS invitations_write qui bloque les non-membres)
 *
 * Le flow de signup auth.signUp / signIn reste cote client : seule la
 * liaison profile <-> company est cote serveur car bloquee par les
 * triggers/RLS sinon.
 */
export async function POST(
  request: Request,
  context: { params: Promise<{ token: string }> },
) {
  const { token } = await context.params;
  if (!token) {
    return NextResponse.json({ error: "Token manquant" }, { status: 400 });
  }

  // Verifie que l'user est authentifie
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user || !user.email) {
    return NextResponse.json({ error: "Non authentifie" }, { status: 401 });
  }

  let body: { fullName?: string };
  try {
    body = await request.json();
  } catch {
    body = {};
  }
  const fullName =
    typeof body.fullName === "string" && body.fullName.trim().length > 0
      ? body.fullName.trim().slice(0, 200)
      : null;

  const admin = createAdminClient();

  // Charge l'invitation
  const { data: inv, error: invErr } = await admin
    .from("team_invitations")
    .select("id, email, team_role, company_id, status, expires_at")
    .eq("token", token)
    .maybeSingle();

  if (invErr) {
    console.error("[invitation.accept.lookup]", invErr);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
  if (!inv) {
    return NextResponse.json({ error: "Invitation introuvable" }, { status: 404 });
  }
  if (inv.status !== "pending") {
    return NextResponse.json(
      { error: `Invitation deja ${inv.status}` },
      { status: 410 },
    );
  }
  if (inv.expires_at && new Date(inv.expires_at).getTime() < Date.now()) {
    return NextResponse.json({ error: "Invitation expiree" }, { status: 410 });
  }

  // L'user authentifie doit correspondre a l'invitation
  if (user.email.toLowerCase() !== inv.email.toLowerCase()) {
    return NextResponse.json(
      { error: "Cette invitation est destinee a une autre adresse email." },
      { status: 403 },
    );
  }

  // S'assure que le profile existe (creation lazy si trigger
  // on_auth_user_created absent ou si l'user vient juste d'etre cree)
  const { data: existingProfile } = await admin
    .from("profiles")
    .select("id, full_name")
    .eq("id", user.id)
    .maybeSingle();

  if (!existingProfile) {
    const { error: insertErr } = await admin.from("profiles").insert({
      id: user.id,
      email: inv.email,
      full_name: fullName ?? user.user_metadata?.full_name ?? inv.email.split("@")[0],
      role: "employer",
      company_id: inv.company_id,
      team_role: inv.team_role,
    });
    if (insertErr) {
      console.error("[invitation.accept.profile-insert]", insertErr);
      return NextResponse.json({ error: "Erreur creation profile" }, { status: 500 });
    }
  } else {
    const update: Record<string, unknown> = {
      role: "employer",
      company_id: inv.company_id,
      team_role: inv.team_role,
    };
    if (fullName) update.full_name = fullName;
    const { error: updateErr } = await admin
      .from("profiles")
      .update(update)
      .eq("id", user.id);
    if (updateErr) {
      console.error("[invitation.accept.profile-update]", updateErr);
      return NextResponse.json({ error: "Erreur update profile" }, { status: 500 });
    }
  }

  // Mark invitation as accepted
  const { error: acceptErr } = await admin
    .from("team_invitations")
    .update({ status: "accepted" })
    .eq("id", inv.id);
  if (acceptErr) {
    console.error("[invitation.accept.mark]", acceptErr);
    // Non-bloquant : le link profile a deja reussi
  }

  return NextResponse.json({
    ok: true,
    companyId: inv.company_id,
    teamRole: inv.team_role,
  });
}
