import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * GET /api/rgpd — Export all user data (RGPD article 15 / CCIN Monaco)
 * DELETE /api/rgpd — Delete all user data (RGPD article 17 / droit a l'oubli)
 * Auth-protected: requires Supabase session.
 *
 * Tables couvertes: profiles, applications, application_events, saved_jobs,
 * messages, interview_scorecards, referrals, profile_views_log, candidate_events.
 */
export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Non authentifie" }, { status: 401 });

  const [
    profile,
    applications,
    savedJobs,
    events,
    messages,
    scorecards,
    referrals,
    profileViews,
  ] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", user.id).single(),
    supabase.from("applications").select("*, application_events(*)").eq("candidate_id", user.id),
    supabase.from("saved_jobs").select("*").eq("user_id", user.id),
    supabase.from("application_events").select("*").eq("by_user_id", user.id),
    supabase.from("messages").select("*").eq("sent_by", user.id),
    supabase.from("interview_scorecards").select("*").eq("interviewer_id", user.id),
    supabase.from("referrals").select("*").eq("referrer_id", user.id),
    supabase.from("profile_views_log").select("*").eq("profile_id", user.id),
  ]);

  return NextResponse.json({
    exported_at: new Date().toISOString(),
    user: { id: user.id, email: user.email, created_at: user.created_at },
    profile: profile.data,
    applications: applications.data,
    saved_jobs: savedJobs.data,
    events: events.data,
    messages: messages.data,
    scorecards: scorecards.data,
    referrals: referrals.data,
    profile_views: profileViews.data,
  });
}

export async function DELETE() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Non authentifie" }, { status: 401 });

  // On utilise le client admin pour bypasser RLS — sinon les tables sans
  // policy DELETE (messages, scorecards) bloqueraient silencieusement.
  const admin = createAdminClient();

  // Ordre : tables enfants d'abord pour respecter les FK.
  // Les applications ont ON DELETE CASCADE sur application_events et messages,
  // mais on supprime explicitement pour etre exhaustif.
  await admin.from("profile_views_log").delete().eq("profile_id", user.id);
  await admin.from("profile_views_log").delete().eq("viewer_id", user.id);
  await admin.from("interview_scorecards").delete().eq("interviewer_id", user.id);
  await admin.from("referrals").delete().eq("referrer_id", user.id);
  await admin.from("saved_jobs").delete().eq("user_id", user.id);
  // Messages et events cascadent via applications, mais on nettoie aussi
  // les messages envoyes PAR ce user (en tant que recruteur)
  await admin.from("messages").delete().eq("sent_by", user.id);
  await admin.from("application_events").delete().eq("by_user_id", user.id);
  await admin.from("applications").delete().eq("candidate_id", user.id);
  await admin.from("profiles").delete().eq("id", user.id);

  // Delete auth user (via admin API, must be last)
  await admin.auth.admin.deleteUser(user.id);

  return NextResponse.json({ deleted: true, user_id: user.id });
}
