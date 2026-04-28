import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendEmail } from "@/lib/email/send";
import * as templates from "@/lib/email/templates";

const SITE = "https://montecarlowork.com";

/**
 * Log un message sortant dans la table `messages` (pour afficher l'historique
 * dans la fiche candidat + alimenter le reporting). On utilise la service_role
 * pour bypass RLS sur l'update delivery_status.
 */
async function logOutboundMessage(params: {
  applicationId: string;
  kind: string;
  subject: string;
  body: string;
  sentById: string;
  sentByName: string;
  sent: boolean;
}): Promise<void> {
  try {
    const admin = createAdminClient();
    await admin.from("messages").insert({
      application_id: params.applicationId,
      direction: "outbound",
      kind: params.kind,
      subject: params.subject,
      body: params.body,
      sent_by: params.sentById,
      sent_by_name: params.sentByName,
      delivery_status: params.sent ? "sent" : "failed",
    });
  } catch {
    // Fail-silent : si le log casse, on ne veut pas bloquer l'envoi email.
  }
}

/**
 * Resolve the recruiter email(s) for a given job ID.
 * Finds all admin/recruiter profiles linked to the job's company.
 */
async function resolveRecruiterEmails(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any,
  jobId: string,
): Promise<Array<{ email: string; name: string }>> {
  const { data: job } = await supabase
    .from("jobs")
    .select("company_id")
    .eq("id", jobId)
    .single();
  if (!job) return [];

  const { data: profiles } = await supabase
    .from("profiles")
    .select("email, full_name")
    .eq("company_id", job.company_id)
    .in("team_role", ["admin", "recruiter"]);

  return (profiles ?? []).map((p: { email: string; full_name: string }) => ({
    email: p.email,
    name: p.full_name ?? p.email.split("@")[0],
  }));
}

/**
 * Resolve candidate info from application ID.
 */
async function resolveCandidateFromApp(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any,
  applicationId: string,
): Promise<{ email: string; name: string; jobTitle: string; companyName: string } | null> {
  const { data } = await supabase
    .from("applications")
    .select(`
      candidate_id,
      job:jobs(title, company:companies(name)),
      candidate:profiles!applications_candidate_id_fkey(email, full_name)
    `)
    .eq("id", applicationId)
    .single();

  if (!data) return null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const c = data.candidate as any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const j = data.job as any;
  return {
    email: c?.email ?? "",
    name: c?.full_name ?? "Candidat",
    jobTitle: j?.title ?? "Offre",
    companyName: j?.company?.name ?? "Entreprise",
  };
}

/**
 * POST /api/notify
 * Body: { type, data }
 *
 * Handles all email notifications. Auto-resolves recruiter/candidate
 * emails from Supabase when not provided.
 */
export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Non authentifie" }, { status: 401 });
  }

  const body = await request.json();
  const { type, data } = body;

  const results: boolean[] = [];

  switch (type) {
    // ─── CANDIDAT NOTIFICATIONS ─────────────────────

    case "candidature_confirmee": {
      const email = templates.candidatureConfirmee({
        candidatName: data.candidatName,
        jobTitle: data.jobTitle,
        companyName: data.companyName,
        jobUrl: `${SITE}/candidat/candidatures/${data.applicationId}`,
      });
      results.push(await sendEmail({ to: data.candidatEmail, ...email }));
      break;
    }

    case "statut_mis_a_jour": {
      // Resolve candidate email from application ID if not provided
      let candidatEmail = data.candidatEmail;
      let candidatName = data.candidatName;
      let jobTitle = data.jobTitle;
      let companyName = data.companyName;

      if (!candidatEmail && data.applicationId) {
        const info = await resolveCandidateFromApp(supabase, data.applicationId);
        if (info) {
          candidatEmail = info.email;
          candidatName = candidatName || info.name;
          jobTitle = jobTitle || info.jobTitle;
          companyName = companyName || info.companyName;
        }
      }

      if (!candidatEmail) break;

      const email = templates.statutMisAJour({
        candidatName,
        jobTitle,
        companyName,
        newStatus: data.newStatus,
        statusLabel: data.statusLabel,
        jobUrl: `${SITE}/candidat/candidatures/${data.applicationId}`,
      });
      const sent = await sendEmail({ to: candidatEmail, ...email });
      results.push(sent);
      if (data.applicationId) {
        await logOutboundMessage({
          applicationId: data.applicationId,
          kind: `status_${data.newStatus ?? "update"}`,
          subject: email.subject,
          body: `Statut mis a jour : ${data.statusLabel ?? data.newStatus}`,
          sentById: user.id,
          sentByName: user.user_metadata?.full_name ?? "Systeme",
          sent,
        });
      }
      break;
    }

    case "message_recruteur": {
      let candidatEmail = data.candidatEmail;
      let candidatName = data.candidatName;
      let jobTitle = data.jobTitle;
      let companyName = data.companyName;

      if (!candidatEmail && data.applicationId) {
        const info = await resolveCandidateFromApp(supabase, data.applicationId);
        if (info) {
          candidatEmail = info.email;
          candidatName = candidatName || info.name;
          jobTitle = jobTitle || info.jobTitle;
          companyName = companyName || info.companyName;
        }
      }

      if (!candidatEmail) break;

      const recruiterName = data.recruiterName || user.user_metadata?.full_name || "Recruteur";
      const email = templates.messageRecruteur({
        candidatName,
        jobTitle,
        companyName,
        recruiterName,
        messagePreview: data.messagePreview || "",
        jobUrl: `${SITE}/candidat/candidatures/${data.applicationId}`,
      });
      const sent = await sendEmail({ to: candidatEmail, ...email });
      results.push(sent);
      if (data.applicationId) {
        await logOutboundMessage({
          applicationId: data.applicationId,
          kind: data.kind ?? "custom",
          subject: email.subject,
          body: data.messagePreview || data.fullBody || "",
          sentById: user.id,
          sentByName: recruiterName,
          sent,
        });
      }
      break;
    }

    // ─── RECRUTEUR NOTIFICATIONS ────────────────────

    case "nouvelle_candidature":
    case "candidat_top_match": {
      // Resolve recruiter emails from job
      const recruiters = data.jobId
        ? await resolveRecruiterEmails(supabase, data.jobId)
        : [];

      for (const rec of recruiters) {
        const tpl = type === "candidat_top_match" && data.matchScore >= 80
          ? templates.candidatTopMatch({
              recruiterName: rec.name,
              candidatName: data.candidatName,
              jobTitle: data.jobTitle,
              matchScore: data.matchScore,
              candidatureUrl: `${SITE}/recruteur/candidats/${data.applicationId}`,
            })
          : templates.nouvelleCandidature({
              recruiterName: rec.name,
              candidatName: data.candidatName,
              jobTitle: data.jobTitle,
              candidateHeadline: data.candidateHeadline,
              matchScore: data.matchScore,
              candidatureUrl: `${SITE}/recruteur/candidats/${data.applicationId}`,
            });
        results.push(await sendEmail({ to: rec.email, ...tpl }));
      }
      break;
    }

    default:
      return NextResponse.json({ error: `Unknown type: ${type}` }, { status: 400 });
  }

  return NextResponse.json({ sent: results.filter(Boolean).length, total: results.length });
}
