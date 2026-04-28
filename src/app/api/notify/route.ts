import { NextResponse } from "next/server";
import type { SupabaseClient } from "@supabase/supabase-js";
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

type ResolvedApplication = {
  id: string;
  candidate_id: string;
  job_id: string;
  job_title: string;
  job_company_id: string;
  company_name: string;
  candidate_email: string;
  candidate_name: string;
};

/**
 * Charge l'application + jointures critiques en une requete. Utilise
 * service_role pour ne PAS dependre des policies RLS du client (sinon une
 * requete d'un user externe au job retournerait un row vide qui pourrait
 * etre confondu avec "application introuvable").
 */
async function loadApplication(
  applicationId: string,
): Promise<ResolvedApplication | null> {
  const admin = createAdminClient();
  const { data } = await admin
    .from("applications")
    .select(
      `id,
       candidate_id,
       job:jobs(id, title, company_id, company:companies(name)),
       candidate:profiles!applications_candidate_id_fkey(email, full_name)`,
    )
    .eq("id", applicationId)
    .maybeSingle();

  if (!data) return null;
  // Supabase serialise les jointures (avec ou sans `!inner`) comme des tableaux
  // d'un seul element pour les relations parent-vers-enfant resolues 1:1.
  const jobRel = data.job as unknown;
  const candidateRel = data.candidate as unknown;
  const job = (Array.isArray(jobRel) ? jobRel[0] : jobRel) as
    | {
        id: string;
        title: string;
        company_id: string;
        company:
          | { name: string }
          | { name: string }[]
          | null;
      }
    | null;
  const candidate = (Array.isArray(candidateRel) ? candidateRel[0] : candidateRel) as
    | { email: string; full_name: string | null }
    | null;
  if (!job || !candidate) return null;
  const company = Array.isArray(job.company) ? job.company[0] : job.company;
  return {
    id: data.id as string,
    candidate_id: data.candidate_id as string,
    job_id: job.id,
    job_title: job.title,
    job_company_id: job.company_id,
    company_name: company?.name ?? "Entreprise",
    candidate_email: candidate.email,
    candidate_name: candidate.full_name ?? candidate.email.split("@")[0],
  };
}

/** L'appelant fait-il partie de l'equipe recruteur de la company qui owns ce job ? */
async function isCallerEmployerOfCompany(
  supabase: SupabaseClient,
  userId: string,
  companyId: string,
): Promise<boolean> {
  const { data } = await supabase
    .from("profiles")
    .select("company_id, team_role, role")
    .eq("id", userId)
    .maybeSingle();
  if (!data) return false;
  if (data.role !== "employer") return false;
  if (data.company_id !== companyId) return false;
  return ["admin", "recruiter"].includes(data.team_role ?? "");
}

/**
 * Resolve the recruiter email(s) for a given company.
 * Finds all admin/recruiter profiles linked to the company.
 */
async function resolveRecruiterEmails(
  companyId: string,
): Promise<Array<{ email: string; name: string }>> {
  const admin = createAdminClient();
  const { data: profiles } = await admin
    .from("profiles")
    .select("email, full_name")
    .eq("company_id", companyId)
    .in("team_role", ["admin", "recruiter"]);

  return (profiles ?? []).map((p: { email: string; full_name: string | null }) => ({
    email: p.email,
    name: p.full_name ?? p.email.split("@")[0],
  }));
}

/**
 * POST /api/notify
 * Body: { type, data: { applicationId, ... } }
 *
 * Envoie des notifications email transactionnelles. L'authz est verifiee
 * cote serveur pour chaque type :
 *   - candidature_confirmee / nouvelle_candidature / candidat_top_match :
 *     l'appelant doit etre le candidat de l'application
 *   - statut_mis_a_jour / message_recruteur :
 *     l'appelant doit etre un recruteur (admin/recruiter) de la company
 *     qui owns le job de l'application
 *
 * Le client ne peut PAS spoofer l'email destinataire ni le contenu de
 * l'application (jobTitle, companyName, candidatEmail) — tout est resolu
 * cote serveur depuis l'applicationId.
 */
export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Non authentifie" }, { status: 401 });
  }

  let body: { type?: string; data?: Record<string, unknown> };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const type = typeof body?.type === "string" ? body.type : "";
  const data = (body?.data ?? {}) as Record<string, unknown>;
  const applicationId =
    typeof data.applicationId === "string" ? data.applicationId : null;

  if (!applicationId) {
    return NextResponse.json(
      { error: "applicationId required" },
      { status: 400 },
    );
  }

  const app = await loadApplication(applicationId);
  if (!app) {
    return NextResponse.json(
      { error: "Application introuvable" },
      { status: 404 },
    );
  }

  const results: boolean[] = [];

  switch (type) {
    // ─── CANDIDAT envoie a lui-meme / aux recruteurs ────────

    case "candidature_confirmee": {
      if (app.candidate_id !== user.id) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
      const email = templates.candidatureConfirmee({
        candidatName: app.candidate_name,
        jobTitle: app.job_title,
        companyName: app.company_name,
        jobUrl: `${SITE}/candidat/candidatures/${app.id}`,
      });
      results.push(await sendEmail({ to: app.candidate_email, ...email }));
      break;
    }

    case "nouvelle_candidature":
    case "candidat_top_match": {
      if (app.candidate_id !== user.id) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
      const matchScore = typeof data.matchScore === "number" ? data.matchScore : 0;
      const candidateHeadline =
        typeof data.candidateHeadline === "string" ? data.candidateHeadline : undefined;

      const recruiters = await resolveRecruiterEmails(app.job_company_id);
      for (const rec of recruiters) {
        const tpl =
          type === "candidat_top_match" && matchScore >= 80
            ? templates.candidatTopMatch({
                recruiterName: rec.name,
                candidatName: app.candidate_name,
                jobTitle: app.job_title,
                matchScore,
                candidatureUrl: `${SITE}/recruteur/candidats/${app.id}`,
              })
            : templates.nouvelleCandidature({
                recruiterName: rec.name,
                candidatName: app.candidate_name,
                jobTitle: app.job_title,
                candidateHeadline,
                matchScore,
                candidatureUrl: `${SITE}/recruteur/candidats/${app.id}`,
              });
        results.push(await sendEmail({ to: rec.email, ...tpl }));
      }
      break;
    }

    // ─── RECRUTEUR envoie au candidat ─────────────────────

    case "statut_mis_a_jour": {
      const ok = await isCallerEmployerOfCompany(
        supabase,
        user.id,
        app.job_company_id,
      );
      if (!ok) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
      const newStatus = typeof data.newStatus === "string" ? data.newStatus : "";
      const statusLabel =
        typeof data.statusLabel === "string" ? data.statusLabel : newStatus;
      const email = templates.statutMisAJour({
        candidatName: app.candidate_name,
        jobTitle: app.job_title,
        companyName: app.company_name,
        newStatus,
        statusLabel,
        jobUrl: `${SITE}/candidat/candidatures/${app.id}`,
      });
      const sent = await sendEmail({ to: app.candidate_email, ...email });
      results.push(sent);
      await logOutboundMessage({
        applicationId: app.id,
        kind: `status_${newStatus || "update"}`,
        subject: email.subject,
        body: `Statut mis a jour : ${statusLabel}`,
        sentById: user.id,
        sentByName: user.user_metadata?.full_name ?? "Recruteur",
        sent,
      });
      break;
    }

    case "message_recruteur": {
      const ok = await isCallerEmployerOfCompany(
        supabase,
        user.id,
        app.job_company_id,
      );
      if (!ok) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
      const messagePreview =
        typeof data.messagePreview === "string" ? data.messagePreview : "";
      const fullBody =
        typeof data.fullBody === "string" ? data.fullBody : messagePreview;
      const kind = typeof data.kind === "string" ? data.kind : "custom";
      const recruiterName = user.user_metadata?.full_name ?? "Recruteur";

      const email = templates.messageRecruteur({
        candidatName: app.candidate_name,
        jobTitle: app.job_title,
        companyName: app.company_name,
        recruiterName,
        messagePreview,
        jobUrl: `${SITE}/candidat/candidatures/${app.id}`,
      });
      const sent = await sendEmail({ to: app.candidate_email, ...email });
      results.push(sent);
      await logOutboundMessage({
        applicationId: app.id,
        kind,
        subject: email.subject,
        body: fullBody,
        sentById: user.id,
        sentByName: recruiterName,
        sent,
      });
      break;
    }

    default:
      return NextResponse.json({ error: `Unknown type` }, { status: 400 });
  }

  return NextResponse.json({
    sent: results.filter(Boolean).length,
    total: results.length,
  });
}
