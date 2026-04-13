import type {
  BlockType,
  CandidateSource,
  EmployerApplicationEventType,
  EmployerApplicationStatus,
  EmployerJobStatus,
} from "./types";

/* ─── Helpers UI ─────────────────────────────────────────────────── */

export const KANBAN_STATUSES: EmployerApplicationStatus[] = [
  "received",
  "shortlisted",
  "reviewed",
  "interview",
  "offer",
  "hired",
];

export function statusLabel(s: EmployerApplicationStatus): string {
  switch (s) {
    case "received":
      return "Recues";
    case "shortlisted":
      return "Pre-selectionnes";
    case "reviewed":
      return "CV consulte";
    case "interview":
      return "En entretien";
    case "offer":
      return "Offre envoyee";
    case "hired":
      return "Embauche";
    case "rejected":
      return "Refuse";
  }
}

export function statusTone(
  s: EmployerApplicationStatus,
): "muted" | "accent" | "fresh" | "danger" | "bar" {
  switch (s) {
    case "received":
      return "muted";
    case "shortlisted":
      return "accent";
    case "reviewed":
      return "accent";
    case "interview":
      return "fresh";
    case "offer":
      return "fresh";
    case "hired":
      return "fresh";
    case "rejected":
      return "danger";
  }
}

export function jobStatusLabel(s: EmployerJobStatus): string {
  switch (s) {
    case "draft":
      return "Brouillon";
    case "published":
      return "Publiee";
    case "paused":
      return "En pause";
    case "closed":
      return "Fermee";
  }
}

export function jobStatusTone(
  s: EmployerJobStatus,
): "muted" | "accent" | "fresh" | "danger" {
  switch (s) {
    case "draft":
      return "muted";
    case "published":
      return "fresh";
    case "paused":
      return "accent";
    case "closed":
      return "danger";
  }
}

export function eventLabel(t: EmployerApplicationEventType): string {
  switch (t) {
    case "received":
      return "Candidature recue";
    case "cv_viewed":
      return "CV consulte";
    case "status_changed":
      return "Statut modifie";
    case "message_sent":
      return "Message envoye";
    case "note_added":
      return "Note ajoutee";
    case "interview_scheduled":
      return "Entretien planifie";
    case "offer_sent":
      return "Offre envoyee";
    case "hired":
      return "Embauche";
    case "rejected":
      return "Refuse";
  }
}

export function blockTypeLabel(type: BlockType): string {
  switch (type) {
    case "text":
      return "Texte";
    case "image":
      return "Image";
    case "gallery":
      return "Galerie";
    case "quote":
      return "Citation";
    case "stats":
      return "Chiffres";
    case "perks":
      return "Avantages";
    case "video":
      return "Video";
  }
}

export function candidateSourceLabel(s: CandidateSource): string {
  switch (s) {
    case "platform":
      return "Plateforme";
    case "manual":
      return "Ajout manuel";
    case "csv_import":
      return "Import CSV";
    case "referral":
      return "Cooptation";
  }
}
