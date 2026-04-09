import { createBrowserClient } from "@supabase/ssr";

/**
 * Client Supabase cote navigateur — utilise la cle anon (publique).
 * Utilise pour l'auth, les queries temps reel, les subscriptions.
 * Singleton : un seul client par session browser.
 */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
