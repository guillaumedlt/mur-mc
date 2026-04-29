import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  checkRateLimit,
  getClientIp,
  ipToUuid,
} from "@/lib/rate-limit";

/**
 * POST /api/view
 * Body: { jobId }
 * Headers: automatic (IP, User-Agent, Referer)
 *
 * Enregistre une vue unique par visiteur (fingerprint = hash IP + UA).
 * Le trigger Supabase met a jour jobs.views automatiquement.
 * Dedup: la contrainte unique(job_id, fingerprint) ignore les doublons.
 */
export async function POST(request: Request) {
  // Anti-scraping : 100 vues par IP par heure (largement au-dessus du
  // browsing legitime, mais coupe les bots qui inondent /api/view).
  const rl = await checkRateLimit(
    ipToUuid(getClientIp(request)),
    "api.view",
    100,
    60 * 60,
  );
  if (!rl.allowed) {
    return NextResponse.json({ error: "rate limited" }, { status: 429 });
  }

  const body = await request.json();
  const { jobId } = body;

  if (!jobId) {
    return NextResponse.json({ error: "jobId required" }, { status: 400 });
  }

  // Build fingerprint from IP + User-Agent
  const forwarded = request.headers.get("x-forwarded-for");
  const ip = forwarded?.split(",")[0]?.trim() ?? "unknown";
  const ua = request.headers.get("user-agent") ?? "unknown";
  const referrer = request.headers.get("referer") ?? null;

  // Simple hash: combine IP + UA into a stable string
  const raw = `${ip}::${ua}`;
  const encoder = new TextEncoder();
  const data = encoder.encode(raw);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const fingerprint = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");

  const supabase = await createClient();

  // Insert — ignore duplicate (unique constraint on job_id + fingerprint)
  await supabase.from("job_views").insert({
    job_id: jobId,
    fingerprint,
    user_agent: ua.slice(0, 255),
    referrer: referrer?.slice(0, 500) ?? null,
  });

  return NextResponse.json({ ok: true });
}
