import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendEmail } from "@/lib/email/send";
import {
  checkRateLimit,
  getClientIp,
  ipToUuid,
} from "@/lib/rate-limit";

/** Echappe les caracteres HTML pour eviter l'injection dans l'email admin. */
function esc(s: string | null | undefined): string {
  return String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export async function POST(request: Request) {
  // Anti-spam : 3 demandes par IP par 24h.
  const rl = await checkRateLimit(
    ipToUuid(getClientIp(request)),
    "api.contact",
    3,
    24 * 60 * 60,
  );
  if (!rl.allowed) {
    return NextResponse.json(
      { error: "Trop de demandes. Reessayez plus tard." },
      { status: 429 },
    );
  }

  const body = await request.json().catch(() => null);
  const companyName = body?.companyName?.trim();
  const contactName = body?.contactName?.trim();
  const email = body?.email?.trim();
  const phone = body?.phone?.trim() || null;
  const message = body?.message?.trim() || null;
  const plan = body?.plan || "starter";

  if (!companyName || !contactName || !email) {
    return NextResponse.json({ error: "Champs requis manquants" }, { status: 400 });
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: "Email invalide" }, { status: 400 });
  }
  // Garde-fou : taille max raisonnable pour bloquer les payloads abusifs.
  if (
    companyName.length > 200 ||
    contactName.length > 200 ||
    email.length > 200 ||
    (message && message.length > 5000)
  ) {
    return NextResponse.json({ error: "Champs trop longs" }, { status: 400 });
  }

  const admin = createAdminClient();
  const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const { data: existing } = await admin
    .from("contact_requests")
    .select("id")
    .eq("email", email)
    .gte("created_at", yesterday)
    .limit(1);

  if (existing && existing.length > 0) {
    return NextResponse.json({ error: "Demande deja envoyee. Nous vous recontacterons sous 24h." }, { status: 409 });
  }

  const { error } = await admin.from("contact_requests").insert({
    company_name: companyName,
    contact_name: contactName,
    email,
    phone,
    message,
    plan,
  });

  if (error) {
    console.error("[contact.insert]", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }

  try {
    await sendEmail({
      to: "delachetg@gmail.com",
      subject: `Nouvelle demande recruteur — ${companyName} (${plan})`,
      html: `<p><strong>${esc(contactName)}</strong> de <strong>${esc(companyName)}</strong> souhaite recruter sur Monte Carlo Work.</p><p>Email : ${esc(email)}${phone ? " · Tel : " + esc(phone) : ""}</p><p>Forfait : ${esc(plan)}</p>${message ? `<p>Message : ${esc(message)}</p>` : ""}`,
    });
  } catch { /* fail-silent */ }

  return NextResponse.json({ ok: true });
}
