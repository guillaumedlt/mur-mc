import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/admin";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * GET /api/admin/cvtech
 * Returns full candidate list (PII included). Admin-only.
 *
 * IMPORTANT : c'est la seule route qui legitimement liste tous les
 * candidats avec leur PII complet (telephone, bio, CV, etc.). Toute autre
 * lecture de la base candidat passe par les RLS Supabase qui ne doivent PAS
 * autoriser ce niveau de detail aux non-admins.
 */
export async function GET() {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const admin = createAdminClient();

  const { data: profiles, error } = await admin
    .from("profiles")
    .select(
      "id, full_name, email, phone, location, headline, bio, skills, languages, sectors, experience_years, cv_url, cv_file_name, linkedin_url, open_to_work, created_at",
    )
    .eq("role", "candidate")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[admin.cvtech]", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }

  // Compte les candidatures par candidat en une seule query.
  const ids = (profiles ?? []).map((p) => p.id);
  const { data: apps } = await admin
    .from("applications")
    .select("candidate_id")
    .in(
      "candidate_id",
      ids.length ? ids : ["00000000-0000-0000-0000-000000000000"],
    );

  const appCounts = new Map<string, number>();
  for (const a of apps ?? []) {
    if (!a.candidate_id) continue;
    appCounts.set(a.candidate_id, (appCounts.get(a.candidate_id) ?? 0) + 1);
  }

  return NextResponse.json({
    candidates: (profiles ?? []).map((p) => ({
      id: p.id,
      fullName: p.full_name ?? "",
      email: p.email ?? "",
      phone: p.phone ?? null,
      location: p.location ?? null,
      headline: p.headline ?? null,
      bio: p.bio ?? null,
      skills: p.skills ?? [],
      languages: p.languages ?? [],
      sectors: p.sectors ?? [],
      experienceYears: p.experience_years ?? null,
      cvUrl: p.cv_url ?? null,
      cvFileName: p.cv_file_name ?? null,
      linkedinUrl: p.linkedin_url ?? null,
      openToWork: p.open_to_work ?? false,
      applicationCount: appCounts.get(p.id) ?? 0,
      createdAt: p.created_at,
    })),
  });
}
