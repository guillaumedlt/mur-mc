import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/admin";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * GET /api/admin/stats
 * Returns raw datasets used by the admin stats panel. Admin-only.
 *
 * Volontairement minimal et brut : le calcul des KPI / breakdowns se fait
 * cote client (composant `AdminStats`). Cela permet de changer la visu
 * sans toucher au backend.
 */
export async function GET() {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const admin = createAdminClient();
  const [co, jo, ap, ca, al, st] = await Promise.all([
    admin.from("companies").select("id, name, plan, sector, created_at"),
    admin
      .from("jobs")
      .select(
        "id, company_id, status, views, type, sector, level, remote, created_at, published_at",
      ),
    admin
      .from("applications")
      .select("id, job_id, status, source, match_score, applied_at"),
    admin
      .from("profiles")
      .select(
        "id, location, skills, languages, experience_years, open_to_work, created_at",
      )
      .eq("role", "candidate"),
    admin.from("job_alerts").select("id, active, frequency, created_at"),
    admin.from("stories").select("id, slug, created_at"),
  ]);

  const firstError = co.error || jo.error || ap.error || ca.error || al.error || st.error;
  if (firstError) {
    console.error("[admin.stats]", firstError);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }

  return NextResponse.json({
    companies: co.data ?? [],
    jobs: jo.data ?? [],
    applications: ap.data ?? [],
    candidates: ca.data ?? [],
    alerts: al.data ?? [],
    stories: st.data ?? [],
  });
}
