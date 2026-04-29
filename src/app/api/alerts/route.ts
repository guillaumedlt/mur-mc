import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  checkRateLimit,
  getClientIp,
  ipToUuid,
} from "@/lib/rate-limit";

/**
 * POST /api/alerts — Cree une alerte email pour les nouvelles offres.
 *
 * Body: { email, keywords?: string[], sector?: string, contractType?: string, frequency?: "daily"|"weekly" }
 *
 * Fonctionne pour les users connectes (profile_id auto) ET les visiteurs
 * anonymes (juste un email). Les anonymes passent par service_role.
 */
export async function POST(request: Request) {
  // Anti-spam : 10 creations d'alertes par IP par 24h.
  const rl = await checkRateLimit(
    ipToUuid(getClientIp(request)),
    "api.alerts.create",
    10,
    24 * 60 * 60,
  );
  if (!rl.allowed) {
    return NextResponse.json(
      { error: "Trop d'alertes creees. Reessayez plus tard." },
      { status: 429 },
    );
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const body = await request.json().catch(() => null);
  const email: string = body?.email?.trim();
  const keywords: string[] = Array.isArray(body?.keywords) ? body.keywords : [];
  const sector: string | null = body?.sector?.trim() || null;
  const contractType: string | null = body?.contractType?.trim() || null;
  const frequency: "daily" | "weekly" = body?.frequency === "weekly" ? "weekly" : "daily";

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: "Email invalide" }, { status: 400 });
  }
  if (keywords.length === 0 && !sector && !contractType) {
    return NextResponse.json(
      { error: "Au moins un critere requis (keywords, sector ou contractType)" },
      { status: 400 },
    );
  }

  // Admin client pour supporter les inscriptions anonymes (pas d'auth)
  const admin = createAdminClient();

  // Dedup : pas 2 alertes identiques pour le meme email
  const { data: existing } = await admin
    .from("job_alerts")
    .select("id")
    .eq("email", email)
    .eq("active", true)
    .limit(20);

  if (existing && existing.length >= 10) {
    return NextResponse.json(
      { error: "Vous avez deja 10 alertes actives. Supprimez-en une d'abord." },
      { status: 409 },
    );
  }

  const { data: alert, error } = await admin
    .from("job_alerts")
    .insert({
      profile_id: user?.id ?? null,
      email,
      keywords: keywords.length > 0 ? keywords : null,
      sector,
      contract_type: contractType,
      frequency,
    })
    .select("id, token")
    .single();

  if (error) {
    console.error("[alerts.create]", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }

  return NextResponse.json({ ok: true, id: alert?.id, token: alert?.token });
}

/**
 * DELETE /api/alerts?token=xxx — Desactive une alerte (lien unsubscribe dans l'email).
 */
export async function DELETE(request: Request) {
  const url = new URL(request.url);
  const token = url.searchParams.get("token");

  if (!token) {
    return NextResponse.json({ error: "Token requis" }, { status: 400 });
  }

  const admin = createAdminClient();
  const { error } = await admin
    .from("job_alerts")
    .update({ active: false })
    .eq("token", token);

  if (error) {
    console.error("[alerts.delete]", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
