import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * Auth callback route — handles email confirmation, magic links,
 * and password reset redirects from Supabase.
 *
 * Supabase redirige vers /auth/callback?code=XXX après confirmation email.
 * On echange le code contre une session, puis on redirige vers la bonne page.
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      // Determine la redirection en fonction du role
      const {
        data: { user },
      } = await supabase.auth.getUser();
      const role = user?.user_metadata?.role;

      if (next !== "/") {
        // Redirection explicite (ex: reset password)
        return NextResponse.redirect(`${origin}${next}`);
      }

      // Redirection par role
      if (role === "employer") {
        return NextResponse.redirect(`${origin}/recruteur`);
      }
      return NextResponse.redirect(`${origin}/candidat`);
    }
  }

  // En cas d'erreur, redirige vers la page de connexion avec un message
  return NextResponse.redirect(
    `${origin}/connexion?error=confirmation_failed`,
  );
}
