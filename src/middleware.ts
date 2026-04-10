import { type NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

/**
 * Middleware Next.js :
 * 1. Rafraichit les tokens Supabase Auth a chaque requete
 * 2. Redirige les users connectes qui visitent /connexion ou /inscription
 */
export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          for (const { name, value } of cookiesToSet) {
            request.cookies.set(name, value);
          }
          supabaseResponse = NextResponse.next({ request });
          for (const { name, value, options } of cookiesToSet) {
            supabaseResponse.cookies.set(name, value, options);
          }
        },
      },
    },
  );

  // Rafraichir la session
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;

  // /deconnexion doit toujours etre accessible (pas de redirect)
  if (pathname === "/deconnexion") return supabaseResponse;

  // Si deja connecte via Supabase et visite /connexion ou /inscription → redirect
  const isAuthPage =
    pathname === "/connexion" || pathname === "/inscription";
  if (isAuthPage && user) {
    const role = user.user_metadata?.role;
    const url = request.nextUrl.clone();
    url.pathname = role === "employer" ? "/recruteur" : "/candidat";
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
