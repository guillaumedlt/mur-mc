import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/admin";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendEmail } from "@/lib/email/send";
import * as templates from "@/lib/email/templates";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://montecarlowork.com";

/**
 * GET /api/admin/invitations
 * Liste toutes les invitations team pending. Admin-only.
 */
export async function GET() {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const admin = createAdminClient();

  const { data, error } = await admin
    .from("team_invitations")
    .select(
      "id, email, team_role, token, status, created_at, expires_at, company_id, companies(name, slug)",
    )
    .eq("status", "pending")
    .order("created_at", { ascending: false })
    .limit(200);

  if (error) {
    console.error("[admin.invitations.list]", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }

  return NextResponse.json({
    invitations: (data ?? []).map((row) => {
      const co = row.companies as
        | { name: string; slug: string }
        | { name: string; slug: string }[]
        | null;
      const company = Array.isArray(co) ? co[0] : co;
      return {
        id: row.id,
        email: row.email,
        teamRole: row.team_role,
        token: row.token,
        status: row.status,
        createdAt: row.created_at,
        expiresAt: row.expires_at,
        companyId: row.company_id,
        companyName: company?.name ?? "Entreprise",
        companySlug: company?.slug ?? "",
        inviteLink: `${SITE_URL}/invitation/${row.token}`,
      };
    }),
  });
}

/**
 * POST /api/admin/invitations
 * Body: { invitationId: string, action: "resend" | "revoke" }
 *
 * - resend : renvoie l'email via Resend (re-utilise le token existant)
 * - revoke : passe status = "revoked"
 */
export async function POST(request: Request) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  let body: { invitationId?: string; action?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const id = typeof body?.invitationId === "string" ? body.invitationId : null;
  const action = body?.action;
  if (!id) {
    return NextResponse.json({ error: "invitationId required" }, { status: 400 });
  }

  const admin = createAdminClient();

  if (action === "revoke") {
    const { error } = await admin
      .from("team_invitations")
      .update({ status: "revoked" })
      .eq("id", id);
    if (error) {
      console.error("[admin.invitations.revoke]", error);
      return NextResponse.json({ error: "Internal error" }, { status: 500 });
    }
    return NextResponse.json({ ok: true });
  }

  if (action === "resend") {
    const { data: inv, error } = await admin
      .from("team_invitations")
      .select(
        "id, email, team_role, token, status, company_id, companies(name)",
      )
      .eq("id", id)
      .maybeSingle();
    if (error || !inv) {
      return NextResponse.json({ error: "Invitation introuvable" }, { status: 404 });
    }
    if (inv.status !== "pending") {
      return NextResponse.json(
        { error: `Invitation deja ${inv.status}` },
        { status: 409 },
      );
    }
    const co = inv.companies as
      | { name: string }
      | { name: string }[]
      | null;
    const company = Array.isArray(co) ? co[0] : co;
    const companyName = company?.name ?? "votre entreprise";
    const inviteLink = `${SITE_URL}/invitation/${inv.token}`;

    const tpl = templates.invitationEntreprise({
      companyName,
      teamRole: inv.team_role as "admin" | "recruiter" | "viewer",
      inviteLink,
    });

    const sent = await sendEmail({
      to: inv.email,
      subject: tpl.subject,
      html: tpl.html,
    });

    return NextResponse.json({ ok: true, emailSent: sent, inviteLink });
  }

  return NextResponse.json({ error: "Invalid action" }, { status: 400 });
}
