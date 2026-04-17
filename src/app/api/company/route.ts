import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getAuthorizedEmployer } from "@/lib/supabase/authz";

/**
 * PATCH /api/company
 * Body: { patch: Record<string, unknown> }
 *
 * Met a jour l'entreprise de l'appelant (admin ou recruiter).
 * La company cible est TOUJOURS celle de l'appelant — pas paramettrable.
 */

// Liste blanche des champs editables. Tout autre champ du body est ignore.
const EDITABLE_FIELDS = new Set([
  "name",
  "slug",
  "sector",
  "size",
  "location",
  "description",
  "tagline",
  "positioning",
  "culture",
  "perks",
  "website",
  "domain",
  "logo_color",
  "logo_url",
  "initials",
  "founded",
  "has_cover",
  "cover_url",
  "blocks",
]);

export async function PATCH(request: Request) {
  const supabase = await createClient();
  const authz = await getAuthorizedEmployer(supabase, "recruiter");
  if (!authz.ok) return authz.response;
  const { companyId } = authz.employer;

  const body = await request.json().catch(() => null);
  const patch = body?.patch;

  if (!patch || typeof patch !== "object") {
    return NextResponse.json({ error: "patch manquant" }, { status: 400 });
  }

  // Filtrer les champs non-autorises (ex: job_quota, id, created_at…)
  const safePatch: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(patch)) {
    if (EDITABLE_FIELDS.has(key)) {
      safePatch[key] = value;
    }
  }

  if (Object.keys(safePatch).length === 0) {
    return NextResponse.json({ error: "Aucun champ editable dans le patch" }, { status: 400 });
  }

  // Si le slug est modifie, verifier qu'il n'est pas deja pris par une autre company
  if (typeof safePatch.slug === "string") {
    const admin = createAdminClient();
    const { data: clash } = await admin
      .from("companies")
      .select("id")
      .eq("slug", safePatch.slug)
      .neq("id", companyId)
      .maybeSingle();

    if (clash) {
      return NextResponse.json(
        { error: "Ce slug est deja utilise par une autre entreprise" },
        { status: 409 },
      );
    }
  }

  // On passe par le client anon (cookies) : les RLS companies_update verifient
  // que l'appelant est bien dans cette company + team_role in (admin, recruiter).
  // Double check au niveau applicatif : on filtre explicitement .eq("id", companyId).
  const { error } = await supabase
    .from("companies")
    .update(safePatch)
    .eq("id", companyId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
