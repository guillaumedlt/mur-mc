/**
 * Rate limiter persistant pour les API routes (AI + endpoints publics).
 *
 * Persiste via la table `rate_limits` + la RPC Supabase `check_rate_limit`
 * (cf supabase/migrations/0002_security_hardening.sql). Atomique, partage
 * entre toutes les instances serverless, survit aux redeploys.
 *
 * Pour les endpoints AI authentifies : passer le user_id (UUID auth.users).
 * Pour les endpoints publics anonymes : passer un UUID derive de l'IP via
 * `ipToUuid(getClientIp(request))`.
 *
 * Tiers AI (24h glissantes) :
 *  - free      : 3  appels / endpoint
 *  - pro       : 30 appels / endpoint
 *  - recruiter : 50 appels / endpoint
 *
 * Endpoints publics : passer `limit` et `windowSeconds` explicitement.
 *
 * Fail-open sur erreur RPC : si Supabase est down, on laisse passer plutot que
 * de bloquer tous les users. Le service_role key doit etre configuree cote env.
 */

import { createHash } from "node:crypto";
import { createAdminClient } from "@/lib/supabase/admin";

const DEFAULT_WINDOW_SECONDS = 24 * 60 * 60;

const TIER_LIMITS: Record<"free" | "pro" | "recruiter", number> = {
  free: 3,
  pro: 30,
  recruiter: 50,
};

export type RateLimitResult = {
  allowed: boolean;
  remaining: number;
  resetIn: number;
};

export async function checkRateLimit(
  userId: string,
  endpoint: string,
  tierOrLimit: "free" | "pro" | "recruiter" | number = "free",
  windowSeconds: number = DEFAULT_WINDOW_SECONDS,
): Promise<RateLimitResult> {
  const limit =
    typeof tierOrLimit === "number"
      ? tierOrLimit
      : (TIER_LIMITS[tierOrLimit] ?? TIER_LIMITS.free);

  try {
    const admin = createAdminClient();
    const { data, error } = await admin.rpc("check_rate_limit", {
      p_user_id: userId,
      p_endpoint: endpoint,
      p_limit: limit,
      p_window_seconds: windowSeconds,
    });

    if (error || !data) {
      // Fail-open plutot que bloquer tout le monde si la RPC est inaccessible
      console.error("[rate-limit] RPC error, failing open:", error);
      return { allowed: true, remaining: limit, resetIn: windowSeconds * 1000 };
    }

    const payload = data as {
      allowed: boolean;
      remaining: number;
      reset_in_seconds: number;
    };

    return {
      allowed: payload.allowed,
      remaining: payload.remaining,
      resetIn: payload.reset_in_seconds * 1000,
    };
  } catch (err) {
    console.error("[rate-limit] unexpected error, failing open:", err);
    return { allowed: true, remaining: limit, resetIn: windowSeconds * 1000 };
  }
}

/**
 * Extrait l'IP du client depuis les headers (x-forwarded-for, x-real-ip).
 * Sur Vercel, x-forwarded-for est fiable.
 */
export function getClientIp(request: Request): string {
  const xff = request.headers.get("x-forwarded-for");
  if (xff) return xff.split(",")[0]!.trim();
  const xri = request.headers.get("x-real-ip");
  if (xri) return xri;
  return "0.0.0.0";
}

/**
 * Convertit une IP en UUID deterministe (SHA-256 tronque, format 8-4-4-4-12).
 * Permet d'utiliser la table `rate_limits` (user_id uuid) pour les rate-limits
 * IP-based. Le hash inclut un sel statique pour eviter le rainbow-table.
 */
export function ipToUuid(ip: string): string {
  const hash = createHash("sha256")
    .update(`montecarlowork-rl:${ip}`)
    .digest("hex");
  return `${hash.slice(0, 8)}-${hash.slice(8, 12)}-${hash.slice(12, 16)}-${hash.slice(16, 20)}-${hash.slice(20, 32)}`;
}
