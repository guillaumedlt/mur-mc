import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

/**
 * Client Supabase cote serveur (Server Components, Server Actions, Route Handlers).
 * Utilise les cookies Next.js pour l'auth.
 * Doit etre appele dans un contexte async (pas dans un composant client).
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            for (const { name, value, options } of cookiesToSet) {
              cookieStore.set(name, value, options);
            }
          } catch {
            // setAll peut echouer dans un Server Component (lecture seule)
            // C'est attendu — l'auth refresh sera gere par le middleware
          }
        },
      },
    },
  );
}
