import { createClient as createSupabaseClient } from "@supabase/supabase-js";

/**
 * Client Supabase admin (service_role key).
 *
 * A UTILISER UNIQUEMENT COTE SERVEUR, dans des API routes ou Server Actions
 * qui ont deja verifie l'autorisation de l'appelant.
 *
 * Ce client bypass toutes les RLS. Ne JAMAIS l'importer dans un fichier
 * "use client" et ne JAMAIS l'exposer au navigateur.
 *
 * Si SUPABASE_SERVICE_ROLE_KEY n'est pas configuree, lance une erreur
 * au moment de l'appel — la fonction ne doit pas etre utilisee en dev
 * sans cette cle.
 */
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) {
    throw new Error(
      "SUPABASE_SERVICE_ROLE_KEY manquante — createAdminClient() ne peut pas etre appelee sans elle.",
    );
  }

  return createSupabaseClient(url, serviceKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}
