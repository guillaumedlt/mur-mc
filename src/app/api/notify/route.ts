import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { sendEmail } from "@/lib/email/send";
import * as templates from "@/lib/email/templates";

const SITE = "https://mur.mc";

/**
 * POST /api/notify
 * Body: { type, data }
 * Internal API — called by other server code after actions.
 * Auth-protected: requires Supabase session.
 *
 * Types:
 * - candidature_confirmee
 * - statut_mis_a_jour
 * - message_recruteur
 * - nouvelle_candidature
 * - candidat_top_match
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

  let email: { subject: string; html: string } | null = null;
  let to: string | null = null;

  switch (type) {
    case "candidature_confirmee": {
      to = data.candidatEmail;
      email = templates.candidatureConfirmee({
        candidatName: data.candidatName,
        jobTitle: data.jobTitle,
        companyName: data.companyName,
        jobUrl: `${SITE}/candidat/candidatures/${data.applicationId}`,
      });
      break;
    }

    case "statut_mis_a_jour": {
      to = data.candidatEmail;
      email = templates.statutMisAJour({
        candidatName: data.candidatName,
        jobTitle: data.jobTitle,
        companyName: data.companyName,
        newStatus: data.newStatus,
        statusLabel: data.statusLabel,
        jobUrl: `${SITE}/candidat/candidatures/${data.applicationId}`,
      });
      break;
    }

    case "message_recruteur": {
      to = data.candidatEmail;
      email = templates.messageRecruteur({
        candidatName: data.candidatName,
        jobTitle: data.jobTitle,
        companyName: data.companyName,
        recruiterName: data.recruiterName,
        messagePreview: data.messagePreview,
        jobUrl: `${SITE}/candidat/candidatures/${data.applicationId}`,
      });
      break;
    }

    case "nouvelle_candidature": {
      to = data.recruiterEmail;
      email = templates.nouvelleCandidature({
        recruiterName: data.recruiterName,
        candidatName: data.candidatName,
        jobTitle: data.jobTitle,
        candidateHeadline: data.candidateHeadline,
        matchScore: data.matchScore,
        candidatureUrl: `${SITE}/recruteur/candidats/${data.applicationId}`,
      });
      break;
    }

    case "candidat_top_match": {
      to = data.recruiterEmail;
      email = templates.candidatTopMatch({
        recruiterName: data.recruiterName,
        candidatName: data.candidatName,
        jobTitle: data.jobTitle,
        matchScore: data.matchScore,
        candidatureUrl: `${SITE}/recruteur/candidats/${data.applicationId}`,
      });
      break;
    }

    default:
      return NextResponse.json({ error: `Unknown type: ${type}` }, { status: 400 });
  }

  if (!to || !email) {
    return NextResponse.json({ error: "Missing data" }, { status: 400 });
  }

  const sent = await sendEmail({ to, ...email });
  return NextResponse.json({ sent });
}
