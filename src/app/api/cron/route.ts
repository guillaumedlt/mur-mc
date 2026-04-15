import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { sendEmail } from "@/lib/email/send";
import * as templates from "@/lib/email/templates";

const SITE = "https://mur.mc";

/**
 * GET /api/cron?type=rappel|hebdo
 * Called by Vercel Cron or external scheduler.
 * Protected by CRON_SECRET header.
 */
export async function GET(request: Request) {
  // Verify cron secret
  const secret = request.headers.get("authorization");
  const expected = process.env.CRON_SECRET;
  if (expected && secret !== `Bearer ${expected}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(request.url);
  const type = url.searchParams.get("type");

  const supabase = await createClient();

  if (type === "rappel") {
    return await handleRappel(supabase);
  }

  if (type === "hebdo") {
    return await handleHebdo(supabase);
  }

  return NextResponse.json({ error: "Unknown type. Use ?type=rappel or ?type=hebdo" }, { status: 400 });
}

/**
 * Rappel : notify recruiters who have untreated applications (> 5 days).
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function handleRappel(supabase: any) {
  const fiveDaysAgo = new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString();

  // Find companies with old "received" applications
  const { data: oldApps } = await supabase
    .from("applications")
    .select("job_id, applied_at, jobs(company_id)")
    .eq("status", "received")
    .lt("applied_at", fiveDaysAgo);

  if (!oldApps || oldApps.length === 0) {
    return NextResponse.json({ sent: 0, reason: "no pending applications" });
  }

  // Group by company
  const byCompany: Record<string, { count: number; oldestDays: number }> = {};
  for (const app of oldApps) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const companyId = (app.jobs as any)?.company_id;
    if (!companyId) continue;
    const days = Math.round((Date.now() - new Date(app.applied_at).getTime()) / (1000 * 60 * 60 * 24));
    if (!byCompany[companyId]) byCompany[companyId] = { count: 0, oldestDays: 0 };
    byCompany[companyId].count++;
    byCompany[companyId].oldestDays = Math.max(byCompany[companyId].oldestDays, days);
  }

  let sent = 0;
  for (const [companyId, info] of Object.entries(byCompany)) {
    // Get recruiter emails
    const { data: profiles } = await supabase
      .from("profiles")
      .select("email, full_name")
      .eq("company_id", companyId)
      .in("team_role", ["admin", "recruiter"]);

    for (const p of profiles ?? []) {
      const email = templates.rappelCandidaturesEnAttente({
        recruiterName: p.full_name ?? "Recruteur",
        count: info.count,
        oldestDays: info.oldestDays,
        dashboardUrl: `${SITE}/recruteur/candidats`,
      });
      const ok = await sendEmail({ to: p.email, ...email });
      if (ok) sent++;
    }
  }

  return NextResponse.json({ sent });
}

/**
 * Hebdo : weekly report for each company with activity.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function handleHebdo(supabase: any) {
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

  // Get companies with recent applications
  const { data: recentApps } = await supabase
    .from("applications")
    .select("id, job_id, status, match_score, applied_at, candidate:profiles!applications_candidate_id_fkey(full_name), jobs(title, company_id, views, company:companies(name))")
    .gte("applied_at", weekAgo);

  if (!recentApps || recentApps.length === 0) {
    return NextResponse.json({ sent: 0, reason: "no activity this week" });
  }

  // Group by company
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const byCompany: Record<string, { companyName: string; apps: any[]; views: number; interviews: number }> = {};
  for (const app of recentApps) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const j = app.jobs as any;
    const companyId = j?.company_id;
    if (!companyId) continue;
    if (!byCompany[companyId]) {
      byCompany[companyId] = {
        companyName: j?.company?.name ?? "Entreprise",
        apps: [],
        views: 0,
        interviews: 0,
      };
    }
    byCompany[companyId].apps.push(app);
    byCompany[companyId].views += j?.views ?? 0;
    if (app.status === "interview") byCompany[companyId].interviews++;
  }

  let sent = 0;
  const period = `Semaine du ${new Date(weekAgo).toLocaleDateString("fr-FR")}`;

  for (const [companyId, info] of Object.entries(byCompany)) {
    const { data: profiles } = await supabase
      .from("profiles")
      .select("email, full_name")
      .eq("company_id", companyId)
      .in("team_role", ["admin", "recruiter"]);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const topCandidates = info.apps
      .sort((a: { match_score: number }, b: { match_score: number }) => (b.match_score ?? 0) - (a.match_score ?? 0))
      .slice(0, 3)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .map((a: any) => ({
        name: a.candidate?.full_name ?? "Candidat",
        jobTitle: a.jobs?.title ?? "Offre",
        score: a.match_score,
      }));

    for (const p of profiles ?? []) {
      const email = templates.rapportHebdo({
        recruiterName: p.full_name ?? "Recruteur",
        companyName: info.companyName,
        period,
        newApplications: info.apps.length,
        totalViews: info.views,
        interviews: info.interviews,
        topCandidates,
        dashboardUrl: `${SITE}/recruteur`,
      });
      const ok = await sendEmail({ to: p.email, ...email });
      if (ok) sent++;
    }
  }

  return NextResponse.json({ sent });
}
