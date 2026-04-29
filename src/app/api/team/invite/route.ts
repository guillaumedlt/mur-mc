import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getAuthorizedEmployer } from "@/lib/supabase/authz";
import { sendEmail } from "@/lib/email/send";
import * as templates from "@/lib/email/templates";

/**
 * POST /api/team/invite
 * Body: { email: string, teamRole: "admin"|"recruiter"|"viewer" }
 *
 * Cree une invitation d'equipe OU link directement un user existant.
 * Reserve aux admins de la company. La company cible est TOUJOURS celle
 * de l'appelant (pas paramettrable cote client).
 *
 * Envoie un email d'invitation via Supabase Auth admin API (service_role).
 */
export async function POST(request: Request) {
  const supabase = await createClient();

  const authz = await getAuthorizedEmployer(supabase, "admin");
  if (!authz.ok) return authz.response;
  const { userId, companyId } = authz.employer;

  const body = await request.json().catch(() => null);
  const email: string | undefined = body?.email?.trim();
  const teamRole: "admin" | "recruiter" | "viewer" | undefined = body?.teamRole;

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: "Email invalide" }, { status: 400 });
  }
  if (!teamRole || !["admin", "recruiter", "viewer"].includes(teamRole)) {
    return NextResponse.json({ error: "team_role invalide" }, { status: 400 });
  }

  // A partir d'ici on a besoin de bypasser RLS (lecture cross-company pour
  // detecter un user existant + insert team_invitations)
  const admin = createAdminClient();

  // Deja invite dans cette company ?
  const { data: existingInv } = await admin
    .from("team_invitations")
    .select("id")
    .eq("company_id", companyId)
    .eq("email", email)
    .eq("status", "pending")
    .maybeSingle();

  if (existingInv) {
    return NextResponse.json(
      { error: "Cette personne a deja une invitation en attente." },
      { status: 409 },
    );
  }

  // Ce user a-t-il deja un compte ?
  const { data: existingProfile } = await admin
    .from("profiles")
    .select("id, company_id, role")
    .eq("email", email)
    .maybeSingle();

  if (existingProfile?.company_id === companyId) {
    return NextResponse.json(
      { error: "Cette personne fait deja partie de votre equipe." },
      { status: 409 },
    );
  }

  // Il a un compte sans company (ou employer sans company) → on le link directement
  if (existingProfile && !existingProfile.company_id) {
    const { error: linkErr } = await admin
      .from("profiles")
      .update({ company_id: companyId, team_role: teamRole, role: "employer" })
      .eq("id", existingProfile.id);

    if (linkErr) {
      return NextResponse.json({ error: linkErr.message }, { status: 500 });
    }
    return NextResponse.json({ ok: true, linked: true });
  }

  // Il a un compte dans une autre company → on ne touche pas (faille IDOR sinon)
  if (existingProfile && existingProfile.company_id && existingProfile.company_id !== companyId) {
    return NextResponse.json(
      {
        error:
          "Cette adresse email est deja rattachee a une autre entreprise sur Monte Carlo Work.",
      },
      { status: 409 },
    );
  }

  // Pas de compte → on cree l'invitation pending
  const { data: inv, error: invErr } = await admin
    .from("team_invitations")
    .insert({
      company_id: companyId,
      email,
      team_role: teamRole,
      invited_by: userId,
    })
    .select("token")
    .single();

  if (invErr || !inv) {
    return NextResponse.json({ error: invErr?.message ?? "Erreur" }, { status: 500 });
  }

  // Envoi de l'email d'invitation via Resend (pas Supabase Auth :
  // rate-limite 3-4/h en free tier + on perd le branding Monte Carlo Work).
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://montecarlowork.com";
  const inviteLink = `${siteUrl}/invitation/${inv.token}`;

  // Resoudre le nom de la company pour le template (UX)
  const { data: company } = await admin
    .from("companies")
    .select("name")
    .eq("id", companyId)
    .maybeSingle();
  const companyName = company?.name ?? "votre entreprise";

  const tpl = templates.invitationEntreprise({
    companyName,
    teamRole,
    inviteLink,
  });
  const emailSent = await sendEmail({
    to: email,
    subject: tpl.subject,
    html: tpl.html,
  });

  return NextResponse.json({
    ok: true,
    linked: false,
    emailSent,
    inviteLink: emailSent ? undefined : inviteLink,
  });
}
