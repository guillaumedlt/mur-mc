import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/admin";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendEmail } from "@/lib/email/send";
import * as templates from "@/lib/email/templates";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://montecarlowork.com";

const PLAN_QUOTAS: Record<string, number | null> = {
  starter: 3,
  pro: 6,
  business: 10,
  custom: null,
};

/** Slug propre depuis un nom d'entreprise. Garantit l'unicite via suffixe. */
async function generateUniqueSlug(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  admin: any,
  base: string,
): Promise<string> {
  const slugBase = base
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 50) || "entreprise";
  for (let i = 0; i < 10; i++) {
    const candidate = i === 0 ? slugBase : `${slugBase}-${i + 1}`;
    const { data } = await admin
      .from("companies")
      .select("id")
      .eq("slug", candidate)
      .maybeSingle();
    if (!data) return candidate;
  }
  // Fallback : timestamp pour eviter collision
  return `${slugBase}-${Date.now().toString(36).slice(-5)}`;
}

/** Initiales depuis un nom (max 2 lettres). */
function initialsFrom(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "??";
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase();
  return `${parts[0]![0]}${parts[parts.length - 1]![0]}`.toUpperCase();
}

/**
 * POST /api/admin/companies/invite
 *
 * Cree une nouvelle entreprise + invitation admin par email.
 * Optionnellement, si `fromContactRequestId` est fourni, marque la
 * contact_request comme "converted".
 *
 * Body:
 *   companyName: string (required)
 *   email: string (required, admin destinataire)
 *   sector?: string
 *   plan?: "starter"|"pro"|"business"|"custom" (defaut starter)
 *   location?: string (defaut Monaco)
 *   fromContactRequestId?: string (uuid)
 */
export async function POST(request: Request) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let body: {
    companyName?: string;
    email?: string;
    sector?: string;
    plan?: string;
    location?: string;
    fromContactRequestId?: string;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const companyName = (body.companyName ?? "").trim();
  const email = (body.email ?? "").trim().toLowerCase();
  const sector = (body.sector ?? "").trim() || "Autre";
  const location = (body.location ?? "Monaco").trim();
  const plan = body.plan && body.plan in PLAN_QUOTAS ? body.plan : "starter";
  const jobQuota = PLAN_QUOTAS[plan] ?? 3;

  if (!companyName || companyName.length > 200) {
    return NextResponse.json({ error: "companyName invalide" }, { status: 400 });
  }
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: "email invalide" }, { status: 400 });
  }

  const admin = createAdminClient();

  // Le user a-t-il deja un compte rattache a une autre company ?
  const { data: existingProfile } = await admin
    .from("profiles")
    .select("id, company_id, email")
    .eq("email", email)
    .maybeSingle();
  if (existingProfile?.company_id) {
    return NextResponse.json(
      {
        error:
          "Cette adresse email est deja rattachee a une entreprise sur Monte Carlo Work.",
      },
      { status: 409 },
    );
  }

  // Cree la company
  const slug = await generateUniqueSlug(admin, companyName);
  const initials = initialsFrom(companyName);
  const { data: company, error: companyErr } = await admin
    .from("companies")
    .insert({
      name: companyName,
      slug,
      sector,
      location,
      plan,
      job_quota: jobQuota,
      initials,
    })
    .select("id, slug")
    .single();

  if (companyErr || !company) {
    console.error("[admin.companies.invite] create company:", companyErr);
    return NextResponse.json({ error: "Impossible de creer l'entreprise" }, { status: 500 });
  }

  // User existant sans company → on le link directement
  if (existingProfile && !existingProfile.company_id) {
    const { error: linkErr } = await admin
      .from("profiles")
      .update({ company_id: company.id, team_role: "admin", role: "employer" })
      .eq("id", existingProfile.id);
    if (linkErr) {
      console.error("[admin.companies.invite] link profile:", linkErr);
      return NextResponse.json({ error: "Compte cree mais link echoue" }, { status: 500 });
    }
    if (body.fromContactRequestId) {
      await admin
        .from("contact_requests")
        .update({ status: "converted" })
        .eq("id", body.fromContactRequestId);
    }
    return NextResponse.json({
      ok: true,
      linked: true,
      companyId: company.id,
      companySlug: company.slug,
    });
  }

  // Pas de compte → invitation pending + email
  const { data: inv, error: invErr } = await admin
    .from("team_invitations")
    .insert({
      company_id: company.id,
      email,
      team_role: "admin",
    })
    .select("token")
    .single();

  if (invErr || !inv) {
    console.error("[admin.companies.invite] create invitation:", invErr);
    return NextResponse.json({ error: "Echec creation invitation" }, { status: 500 });
  }

  const inviteLink = `${SITE_URL}/invitation/${inv.token}`;

  // Envoi via Resend (pas Supabase Auth) : controle total du template
  // + pas de rate-limit Supabase Auth (3-4 emails/h en free tier).
  const tpl = templates.invitationEntreprise({
    companyName,
    teamRole: "admin",
    inviteLink,
  });
  const emailSent = await sendEmail({ to: email, subject: tpl.subject, html: tpl.html });

  if (body.fromContactRequestId) {
    await admin
      .from("contact_requests")
      .update({ status: "converted" })
      .eq("id", body.fromContactRequestId);
  }

  return NextResponse.json({
    ok: true,
    linked: false,
    companyId: company.id,
    companySlug: company.slug,
    emailSent,
    inviteLink: emailSent ? undefined : inviteLink,
  });
}
