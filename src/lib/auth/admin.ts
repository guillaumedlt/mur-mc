import { createClient } from "@/lib/supabase/server";

/**
 * Liste des emails admin Monte Carlo Work.
 *
 * Source unique cote serveur — utilisee par toutes les routes /api/admin/*.
 * Le check cote client (`admin-panel.tsx`) reste pour l'UX (cacher l'UI) mais
 * n'est PAS la source de verite securite : un user authentifie qui appellerait
 * directement /api/admin/* sans passer par l'UI sera rejete par ce helper.
 *
 * Pour ajouter / retirer un admin : ajouter au csv `ADMIN_EMAILS` dans Vercel
 * ou ajouter ici en fallback (le csv prend la priorite).
 */
const FALLBACK_ADMINS = ["delachetg@gmail.com"];

function adminList(): string[] {
  const csv = process.env.ADMIN_EMAILS;
  if (csv && csv.trim().length > 0) {
    return csv
      .split(",")
      .map((s) => s.trim().toLowerCase())
      .filter(Boolean);
  }
  return FALLBACK_ADMINS.map((s) => s.toLowerCase());
}

export function isAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  return adminList().includes(email.toLowerCase());
}

/**
 * Resoud l'utilisateur courant et verifie qu'il est admin.
 * Renvoie l'email s'il l'est, sinon `null`.
 *
 * A appeler en debut de chaque route /api/admin/*. Si null → renvoyer 403.
 */
export async function requireAdmin(): Promise<{ email: string; userId: string } | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user || !user.email) return null;
  if (!isAdminEmail(user.email)) return null;
  return { email: user.email, userId: user.id };
}
