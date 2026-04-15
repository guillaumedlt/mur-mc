import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * GET /api/rgpd — Export all user data (RGPD article 15 / CCIN Monaco)
 * DELETE /api/rgpd — Delete all user data (RGPD article 17 / droit a l'oubli)
 * Auth-protected: requires Supabase session.
 */
export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Non authentifie" }, { status: 401 });

  // Collect all user data
  const [profile, applications, savedJobs, events] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", user.id).single(),
    supabase.from("applications").select("*, application_events(*)").eq("candidate_id", user.id),
    supabase.from("saved_jobs").select("*").eq("user_id", user.id),
    supabase.from("application_events").select("*").eq("by_user_id", user.id),
  ]);

  return NextResponse.json({
    exported_at: new Date().toISOString(),
    user: { id: user.id, email: user.email, created_at: user.created_at },
    profile: profile.data,
    applications: applications.data,
    saved_jobs: savedJobs.data,
    events: events.data,
  });
}

export async function DELETE() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Non authentifie" }, { status: 401 });

  // Delete in order (respect FK constraints)
  await supabase.from("saved_jobs").delete().eq("user_id", user.id);
  await supabase.from("applications").delete().eq("candidate_id", user.id);
  await supabase.from("profiles").delete().eq("id", user.id);

  // Delete auth user (must be last)
  await supabase.auth.admin.deleteUser(user.id);

  return NextResponse.json({ deleted: true, user_id: user.id });
}
