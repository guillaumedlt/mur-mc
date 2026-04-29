import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  checkRateLimit,
  getClientIp,
  ipToUuid,
} from "@/lib/rate-limit";

/**
 * GET /api/widget?company=slug
 * Returns jobs for a company as JSON (public, no auth needed).
 * Used by the embeddable widget script.
 */
export async function GET(request: Request) {
  // Anti-abuse : 60 requetes par IP par heure (le widget polle toutes les
  // 5min en moyenne, donc une page legitime ne devrait jamais hit cette
  // limite). Le cache 5min cote serveur reduit deja la pression DB.
  const rl = await checkRateLimit(
    ipToUuid(getClientIp(request)),
    "api.widget",
    60,
    60 * 60,
  );
  if (!rl.allowed) {
    return NextResponse.json(
      { error: "rate limited" },
      {
        status: 429,
        headers: { "Access-Control-Allow-Origin": "*" },
      },
    );
  }

  const url = new URL(request.url);
  const companySlug = url.searchParams.get("company");

  if (!companySlug) {
    return NextResponse.json({ error: "company parameter required" }, { status: 400 });
  }

  const supabase = await createClient();

  const { data: company } = await supabase
    .from("companies")
    .select("id, name, slug, logo_url, logo_color, initials")
    .eq("slug", companySlug)
    .single();

  if (!company) {
    return NextResponse.json({ error: "Company not found" }, { status: 404 });
  }

  const { data: jobs } = await supabase
    .from("jobs")
    .select("id, slug, title, type, sector, location, remote, work_time, lang, short_description, published_at")
    .eq("company_id", company.id)
    .eq("status", "published")
    .order("published_at", { ascending: false });

  return NextResponse.json({
    company: {
      name: company.name,
      slug: company.slug,
      logoUrl: company.logo_url,
      logoColor: company.logo_color,
      initials: company.initials,
    },
    jobs: (jobs ?? []).map((j) => ({
      id: j.id,
      slug: j.slug,
      title: j.title,
      type: j.type,
      sector: j.sector,
      location: j.location,
      remote: j.remote,
      workTime: j.work_time,
      lang: j.lang,
      description: j.short_description,
      publishedAt: j.published_at,
      url: `https://montecarlowork.com/jobs/${j.slug}`,
    })),
  }, {
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Cache-Control": "public, s-maxage=300",
    },
  });
}
