/**
 * Rate limiter persistant pour les API routes AI.
 *
 * Persiste via la table `rate_limits` + la RPC Supabase `check_rate_limit`
 * (cf supabase/migrations/0002_security_hardening.sql). Atomique, partage
 * entre toutes les instances serverless, survit aux redeploys.
 *
 * Limites / 24h glissantes :
 *  - free      : 3  appels / endpoint
 *  - pro       : 30 appels / endpoint
 *  - recruiter : 50 appels / endpoint
 *
 * Fail-open sur erreur RPC : si Supabase est down, on laisse passer plutot que
 * de bloquer tous les users. Le service_role key doit etre configuree cote env.
 */

import { createAdminClient } from "@/lib/supabase/admin";

const WINDOW_SECONDS = 24 * 60 * 60;

const LIMITS: Record<"free" | "pro" | "recruiter", number> = {
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
  tier: "free" | "pro" | "recruiter" = "free",
): Promise<RateLimitResult> {
  const limit = LIMITS[tier] ?? LIMITS.free;

  try {
    const admin = createAdminClient();
    const { data, error } = await admin.rpc("check_rate_limit", {
      p_user_id: userId,
      p_endpoint: endpoint,
      p_limit: limit,
      p_window_seconds: WINDOW_SECONDS,
    });

    if (error || !data) {
      // Fail-open plutot que bloquer tout le monde si la RPC est inaccessible
      console.error("[rate-limit] RPC error, failing open:", error);
      return { allowed: true, remaining: limit, resetIn: WINDOW_SECONDS * 1000 };
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
    return { allowed: true, remaining: limit, resetIn: WINDOW_SECONDS * 1000 };
  }
}
