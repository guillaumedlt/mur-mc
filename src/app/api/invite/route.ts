import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * POST /api/invite
 * Body: { email, companyName, role, inviterName, token }
 * Envoie un email d'invitation avec le lien securise /invitation/[token].
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
  const { email, token } = body;

  if (!email || !token) {
    return NextResponse.json({ error: "Email et token requis" }, { status: 400 });
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://montecarlowork.com";
  const inviteLink = `${siteUrl}/invitation/${token}`;

  // Use Supabase Auth to send a custom invite email
  // We use signUp with a random password — the user will set their own via the invitation form
  // If user already exists, that's fine — the invitation link still works
  try {
    await supabase.auth.admin.inviteUserByEmail(email, {
      data: {
        role: "employer",
        full_name: email.split("@")[0],
        invite_token: token,
      },
      redirectTo: inviteLink,
    });
    return NextResponse.json({ sent: true });
  } catch {
    // admin.inviteUserByEmail requires service_role key
    // Fallback: we can't send via Supabase Auth without it
    // The invitation link is still valid — user can navigate to it manually
    return NextResponse.json({ sent: false, link: inviteLink });
  }
}
