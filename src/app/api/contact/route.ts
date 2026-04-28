import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendEmail } from "@/lib/email/send";

export async function POST(request: Request) {
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
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  try {
    await sendEmail({
      to: "delachetg@gmail.com",
      subject: `Nouvelle demande recruteur — ${companyName} (${plan})`,
      html: `<p><strong>${contactName}</strong> de <strong>${companyName}</strong> souhaite recruter sur Monte Carlo Work.</p><p>Email : ${email}${phone ? " · Tel : " + phone : ""}</p><p>Forfait : ${plan}</p>${message ? "<p>Message : " + message + "</p>" : ""}`,
    });
  } catch { /* fail-silent */ }

  return NextResponse.json({ ok: true });
}
