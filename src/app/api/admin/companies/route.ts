import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/admin";
import { createAdminClient } from "@/lib/supabase/admin";

const PLAN_QUOTAS: Record<string, number | null> = {
  starter: 3,
  pro: 6,
  business: 10,
  custom: null,
};

/**
 * GET /api/admin/companies
 * List all companies with member/job counts. Admin-only.
 */
export async function GET() {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const admin = createAdminClient();

  const { data: companies, error } = await admin
    .from("companies")
    .select("id, name, slug, plan, job_quota, sector, created_at")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[admin.companies.list]", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }

  // Counts groupes en parallele pour eviter le N+1 du composant client.
  const ids = (companies ?? []).map((c) => c.id);
  const [members, jobs] = await Promise.all([
    admin
      .from("profiles")
      .select("company_id")
      .in("company_id", ids.length ? ids : ["00000000-0000-0000-0000-000000000000"]),
    admin
      .from("jobs")
      .select("company_id, status")
      .in("company_id", ids.length ? ids : ["00000000-0000-0000-0000-000000000000"]),
  ]);

  const memberCounts = new Map<string, number>();
  for (const m of members.data ?? []) {
    if (!m.company_id) continue;
    memberCounts.set(m.company_id, (memberCounts.get(m.company_id) ?? 0) + 1);
  }
  const jobCounts = new Map<string, number>();
  for (const j of jobs.data ?? []) {
    if (!j.company_id) continue;
    if (j.status !== "published" && j.status !== "paused") continue;
    jobCounts.set(j.company_id, (jobCounts.get(j.company_id) ?? 0) + 1);
  }

  return NextResponse.json({
    companies: (companies ?? []).map((c) => ({
      id: c.id,
      name: c.name,
      slug: c.slug,
      plan: c.plan ?? "starter",
      jobQuota: c.job_quota ?? 3,
      sector: c.sector ?? "",
      memberCount: memberCounts.get(c.id) ?? 0,
      jobCount: jobCounts.get(c.id) ?? 0,
      createdAt: c.created_at,
    })),
  });
}

/**
 * POST /api/admin/companies
 * Update plan / job_quota for a company. Admin-only.
 * Body: { id: string, plan?: string, jobQuota?: number }
 */
export async function POST(request: Request) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  let body: { id?: string; plan?: string; jobQuota?: number };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const id = typeof body?.id === "string" ? body.id : null;
  if (!id) {
    return NextResponse.json({ error: "id required" }, { status: 400 });
  }

  const patch: { plan?: string; job_quota?: number } = {};
  if (typeof body.plan === "string" && body.plan in PLAN_QUOTAS) {
    patch.plan = body.plan;
    const preset = PLAN_QUOTAS[body.plan];
    if (preset !== null) patch.job_quota = preset;
  }
  if (typeof body.jobQuota === "number" && body.jobQuota > 0 && body.jobQuota <= 1000) {
    patch.job_quota = Math.floor(body.jobQuota);
  }
  if (Object.keys(patch).length === 0) {
    return NextResponse.json({ error: "Nothing to update" }, { status: 400 });
  }

  const admin = createAdminClient();
  const { error } = await admin.from("companies").update(patch).eq("id", id);
  if (error) {
    console.error("[admin.companies.update]", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
