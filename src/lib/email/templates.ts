/**
 * Email templates for Mur.mc notifications.
 * All templates return { subject, html } ready for Resend.
 */

const BRAND = {
  name: "Mur.mc",
  url: "https://mur.mc",
  color: "#1C3D5A",
  accentColor: "#2563eb",
};

function layout(content: string): string {
  return `<!DOCTYPE html>
<html lang="fr">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f5f4f1;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f4f1;padding:32px 16px">
<tr><td align="center">
<table width="100%" style="max-width:560px;background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #e5e4e0">

<!-- Header -->
<tr><td style="padding:28px 32px 20px;border-bottom:3px solid ${BRAND.color}">
<a href="${BRAND.url}" style="text-decoration:none;color:${BRAND.color};font-size:18px;font-weight:700;letter-spacing:-0.02em">${BRAND.name}</a>
</td></tr>

<!-- Content -->
<tr><td style="padding:32px">
${content}
</td></tr>

<!-- Footer -->
<tr><td style="padding:20px 32px;background:#f9f9f8;border-top:1px solid #e5e4e0">
<p style="margin:0;font-size:11px;color:#999;line-height:1.5">
Cet email a ete envoye par <a href="${BRAND.url}" style="color:${BRAND.color};text-decoration:none">${BRAND.name}</a> — Le mur d'offres de Monaco.<br>
Pour gerer vos notifications, connectez-vous a votre espace.
</p>
</td></tr>

</table>
</td></tr>
</table>
</body>
</html>`;
}

function button(text: string, href: string): string {
  return `<a href="${href}" style="display:inline-block;padding:12px 24px;background:${BRAND.color};color:#ffffff;text-decoration:none;border-radius:8px;font-size:14px;font-weight:600;margin-top:8px">${text}</a>`;
}

function heading(text: string): string {
  return `<h1 style="margin:0 0 16px;font-size:22px;font-weight:700;color:#0a0a0a;line-height:1.2;letter-spacing:-0.01em">${text}</h1>`;
}

function paragraph(text: string): string {
  return `<p style="margin:0 0 16px;font-size:15px;color:#333;line-height:1.65">${text}</p>`;
}

function badge(text: string, color = BRAND.accentColor): string {
  return `<span style="display:inline-block;padding:4px 12px;background:${color}15;color:${color};border-radius:20px;font-size:12px;font-weight:600">${text}</span>`;
}

// ─── CANDIDAT TEMPLATES ─────────────────────────────

export function candidatureConfirmee(data: {
  candidatName: string;
  jobTitle: string;
  companyName: string;
  jobUrl: string;
}) {
  return {
    subject: `Candidature envoyee — ${data.jobTitle}`,
    html: layout(`
      ${heading(`Candidature envoyee`)}
      ${paragraph(`Bonjour ${data.candidatName},`)}
      ${paragraph(`Votre candidature pour le poste de <strong>${data.jobTitle}</strong> chez <strong>${data.companyName}</strong> a bien ete transmise.`)}
      ${paragraph(`Le recruteur recevra votre profil et vous contactera s'il souhaite avancer. Vous serez notifie par email a chaque etape.`)}
      ${button("Voir ma candidature", data.jobUrl)}
    `),
  };
}

export function statutMisAJour(data: {
  candidatName: string;
  jobTitle: string;
  companyName: string;
  newStatus: string;
  statusLabel: string;
  jobUrl: string;
}) {
  const statusColors: Record<string, string> = {
    shortlisted: "#2563eb",
    interview: "#16a34a",
    offer: "#16a34a",
    hired: "#16a34a",
    rejected: "#dc2626",
  };
  const color = statusColors[data.newStatus] ?? BRAND.accentColor;

  return {
    subject: `${data.statusLabel} — ${data.jobTitle}`,
    html: layout(`
      ${heading(data.statusLabel)}
      ${paragraph(`Bonjour ${data.candidatName},`)}
      ${paragraph(`Mise a jour de votre candidature pour <strong>${data.jobTitle}</strong> chez <strong>${data.companyName}</strong> :`)}
      <div style="padding:16px;background:#f9f9f8;border-radius:12px;border:1px solid #e5e4e0;margin-bottom:16px">
        ${badge(data.statusLabel, color)}
      </div>
      ${button("Voir le detail", data.jobUrl)}
    `),
  };
}

export function messageRecruteur(data: {
  candidatName: string;
  jobTitle: string;
  companyName: string;
  recruiterName: string;
  messagePreview: string;
  jobUrl: string;
}) {
  return {
    subject: `Message de ${data.companyName} — ${data.jobTitle}`,
    html: layout(`
      ${heading(`Nouveau message`)}
      ${paragraph(`Bonjour ${data.candidatName},`)}
      ${paragraph(`<strong>${data.recruiterName}</strong> de <strong>${data.companyName}</strong> vous a envoye un message concernant votre candidature pour <strong>${data.jobTitle}</strong> :`)}
      <div style="padding:16px 20px;background:#f9f9f8;border-left:3px solid ${BRAND.color};border-radius:0 12px 12px 0;margin-bottom:16px">
        <p style="margin:0;font-size:14px;color:#333;line-height:1.6;font-style:italic">${data.messagePreview}</p>
      </div>
      ${button("Repondre", data.jobUrl)}
    `),
  };
}

export function nouvelleOffreMatchante(data: {
  candidatName: string;
  jobTitle: string;
  companyName: string;
  matchScore: number;
  jobUrl: string;
  location: string;
  type: string;
}) {
  return {
    subject: `Offre recommandee : ${data.jobTitle} (${data.matchScore}% match)`,
    html: layout(`
      ${heading(`Une offre qui vous correspond`)}
      ${paragraph(`Bonjour ${data.candidatName},`)}
      ${paragraph(`Nous avons trouve une offre qui correspond a votre profil :`)}
      <div style="padding:20px;background:#f9f9f8;border-radius:12px;border:1px solid #e5e4e0;margin-bottom:16px">
        <p style="margin:0 0 4px;font-size:18px;font-weight:700;color:#0a0a0a">${data.jobTitle}</p>
        <p style="margin:0 0 12px;font-size:13px;color:#666">${data.companyName} · ${data.location} · ${data.type}</p>
        ${badge(`${data.matchScore}% match`)}
      </div>
      ${button("Voir l'offre", data.jobUrl)}
    `),
  };
}

// ─── RECRUTEUR TEMPLATES ────────────────────────────

export function nouvelleCandidature(data: {
  recruiterName: string;
  candidatName: string;
  jobTitle: string;
  candidateHeadline?: string;
  matchScore?: number;
  candidatureUrl: string;
}) {
  return {
    subject: `Nouvelle candidature — ${data.jobTitle}`,
    html: layout(`
      ${heading(`Nouvelle candidature`)}
      ${paragraph(`Bonjour ${data.recruiterName},`)}
      ${paragraph(`<strong>${data.candidatName}</strong> a postule pour <strong>${data.jobTitle}</strong>.`)}
      <div style="padding:16px 20px;background:#f9f9f8;border-radius:12px;border:1px solid #e5e4e0;margin-bottom:16px">
        <p style="margin:0;font-size:16px;font-weight:600;color:#0a0a0a">${data.candidatName}</p>
        ${data.candidateHeadline ? `<p style="margin:4px 0 0;font-size:13px;color:#666">${data.candidateHeadline}</p>` : ""}
        ${data.matchScore && data.matchScore >= 60 ? `<div style="margin-top:8px">${badge(`${data.matchScore}% match`)}</div>` : ""}
      </div>
      ${button("Consulter le profil", data.candidatureUrl)}
    `),
  };
}

export function candidatTopMatch(data: {
  recruiterName: string;
  candidatName: string;
  jobTitle: string;
  matchScore: number;
  candidatureUrl: string;
}) {
  return {
    subject: `Top Match (${data.matchScore}%) — ${data.candidatName} pour ${data.jobTitle}`,
    html: layout(`
      ${heading(`Candidat Top Match`)}
      ${paragraph(`Bonjour ${data.recruiterName},`)}
      ${paragraph(`Un candidat avec un score de compatibilite eleve a postule pour <strong>${data.jobTitle}</strong> :`)}
      <div style="padding:20px;background:#f0fdf4;border-radius:12px;border:1px solid #bbf7d0;margin-bottom:16px;text-align:center">
        <p style="margin:0;font-size:36px;font-weight:700;color:#16a34a">${data.matchScore}%</p>
        <p style="margin:4px 0 0;font-size:14px;color:#333">Score de compatibilite</p>
        <p style="margin:8px 0 0;font-size:16px;font-weight:600;color:#0a0a0a">${data.candidatName}</p>
      </div>
      ${button("Voir le profil", data.candidatureUrl)}
    `),
  };
}

export function rappelCandidaturesEnAttente(data: {
  recruiterName: string;
  count: number;
  oldestDays: number;
  dashboardUrl: string;
}) {
  return {
    subject: `${data.count} candidature${data.count > 1 ? "s" : ""} en attente de traitement`,
    html: layout(`
      ${heading(`Candidatures en attente`)}
      ${paragraph(`Bonjour ${data.recruiterName},`)}
      ${paragraph(`Vous avez <strong>${data.count} candidature${data.count > 1 ? "s" : ""}</strong> en attente de traitement, dont certaines depuis <strong>${data.oldestDays} jours</strong>.`)}
      ${paragraph(`Les candidats attendent votre retour — un traitement rapide ameliore votre marque employeur.`)}
      ${button("Traiter les candidatures", data.dashboardUrl)}
    `),
  };
}

export function rapportHebdo(data: {
  recruiterName: string;
  companyName: string;
  period: string;
  newApplications: number;
  totalViews: number;
  interviews: number;
  topCandidates: Array<{ name: string; jobTitle: string; score?: number }>;
  dashboardUrl: string;
}) {
  const topList = data.topCandidates
    .map((c) => `<li style="padding:4px 0;font-size:14px;color:#333">${c.name} — ${c.jobTitle}${c.score ? ` (${c.score}%)` : ""}</li>`)
    .join("");

  return {
    subject: `Recap hebdo — ${data.companyName}`,
    html: layout(`
      ${heading(`Votre semaine sur Mur.mc`)}
      ${paragraph(`Bonjour ${data.recruiterName}, voici le recap de la semaine pour <strong>${data.companyName}</strong> :`)}

      <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:20px">
        <tr>
          <td style="padding:16px;background:#f9f9f8;border-radius:12px;text-align:center;border:1px solid #e5e4e0">
            <p style="margin:0;font-size:28px;font-weight:700;color:${BRAND.color}">${data.newApplications}</p>
            <p style="margin:4px 0 0;font-size:11px;color:#999;text-transform:uppercase;letter-spacing:0.08em">Candidatures</p>
          </td>
          <td width="12"></td>
          <td style="padding:16px;background:#f9f9f8;border-radius:12px;text-align:center;border:1px solid #e5e4e0">
            <p style="margin:0;font-size:28px;font-weight:700;color:${BRAND.color}">${data.totalViews}</p>
            <p style="margin:4px 0 0;font-size:11px;color:#999;text-transform:uppercase;letter-spacing:0.08em">Vues</p>
          </td>
          <td width="12"></td>
          <td style="padding:16px;background:#f9f9f8;border-radius:12px;text-align:center;border:1px solid #e5e4e0">
            <p style="margin:0;font-size:28px;font-weight:700;color:${BRAND.color}">${data.interviews}</p>
            <p style="margin:4px 0 0;font-size:11px;color:#999;text-transform:uppercase;letter-spacing:0.08em">Entretiens</p>
          </td>
        </tr>
      </table>

      ${data.topCandidates.length > 0 ? `
        <p style="margin:0 0 8px;font-size:12px;font-weight:600;color:#999;text-transform:uppercase;letter-spacing:0.08em">Top candidats</p>
        <ul style="margin:0 0 16px;padding-left:16px">${topList}</ul>
      ` : ""}

      ${button("Voir le dashboard", data.dashboardUrl)}
    `),
  };
}
