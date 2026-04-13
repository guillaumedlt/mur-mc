import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * POST /api/invite
 * Body: { email, companyName, role, inviterName }
 * Envoie un email d'invitation via Supabase Auth (invite by email).
 * Protege : requiert un user Supabase authentifie.
 */
export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Non authentifie" }, { status: 401 });
  }

  const body = await request.json();
  const { email, companyName, role, inviterName } = body;

  if (!email) {
    return NextResponse.json({ error: "Email requis" }, { status: 400 });
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://mur.mc";

  // Use Supabase Auth admin to send an invite email
  // This sends a magic link email that creates the account if it doesn't exist
  const { error } = await supabase.auth.admin.inviteUserByEmail(email, {
    data: {
      role: "employer",
      full_name: email.split("@")[0],
      invited_to_company: companyName,
      invited_by: inviterName,
      team_role: role,
    },
    redirectTo: `${siteUrl}/auth/callback`,
  });

  if (error) {
    // If admin invite fails (no service role), fallback to a simple
    // Supabase signUp with auto-confirm disabled — the user will get
    // a confirmation email
    const { error: signUpError } = await supabase.auth.signUp({
      email,
      password: crypto.randomUUID(), // Random password, user will reset
      options: {
        data: {
          role: "employer",
          full_name: email.split("@")[0],
        },
        emailRedirectTo: `${siteUrl}/auth/callback`,
      },
    });

    if (signUpError) {
      // User probably already exists — that's fine, the invitation
      // table entry will auto-link them on next login
      return NextResponse.json({ sent: false, reason: "existing_account" });
    }
  }

  return NextResponse.json({ sent: true });
}
