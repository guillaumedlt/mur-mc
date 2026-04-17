import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getAuthorizedEmployer } from "@/lib/supabase/authz";

/**
 * DELETE /api/team/invitation?id=<invitationId>
 *
 * Revoque une invitation en attente. Reserve aux admins de la company.
 */
export async function DELETE(request: Request) {
  const supabase = await createClient();
  const authz = await getAuthorizedEmployer(supabase, "admin");
  if (!authz.ok) return authz.response;
  const { companyId } = authz.employer;

  const url = new URL(request.url);
  const invitationId = url.searchParams.get("id");

  if (!invitationId) {
    return NextResponse.json({ error: "id requis" }, { status: 400 });
  }

  const admin = createAdminClient();

  // Verifier que l'invitation appartient bien a la company de l'appelant
  const { data: invitation } = await admin
    .from("team_invitations")
    .select("id, company_id, status")
    .eq("id", invitationId)
    .maybeSingle();

  if (!invitation || invitation.company_id !== companyId) {
    return NextResponse.json(
      { error: "Invitation introuvable dans votre equipe" },
      { status: 404 },
    );
  }

  if (invitation.status !== "pending") {
    return NextResponse.json(
      { error: "Cette invitation n'est plus en attente" },
      { status: 409 },
    );
  }

  const { error } = await admin
    .from("team_invitations")
    .update({ status: "revoked" })
    .eq("id", invitationId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
