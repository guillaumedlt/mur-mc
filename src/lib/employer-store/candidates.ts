import type { EmployerApplication, EmployerCandidate } from "./types";
import { cached, setCached, ensureLoaded, persist, emit, uid } from "./core";

/* ─── Ajout manuel de candidats ──────────────────────────────────── */

export function addManualCandidate(
  input: Omit<EmployerCandidate, "id" | "source"> & {
    jobId?: string;
    coverLetter?: string;
  },
): { candidate: EmployerCandidate; application?: EmployerApplication } {
  ensureLoaded();
  const now = new Date().toISOString();
  const candidate: EmployerCandidate = {
    ...input,
    id: uid("emp-cand"),
    source: "manual",
  };
  setCached({ ...cached, candidates: [...cached.candidates, candidate] });

  let application: EmployerApplication | undefined;
  if (input.jobId) {
    application = {
      id: uid("emp-app"),
      jobId: input.jobId,
      candidateId: candidate.id,
      status: "received",
      matchScore: 50,
      rating: 0,
      appliedAt: now,
      updatedAt: now,
      coverLetter: input.coverLetter,
      events: [
        {
          id: uid("evt"),
          type: "received",
          at: now,
          text: "Candidat ajoute manuellement",
          by: input.addedBy,
        },
      ],
      order: cached.applications.filter((a) => a.jobId === input.jobId && a.status === "received").length,
    };
    setCached({
      ...cached,
      applications: [...cached.applications, application],
    });
  }

  persist();
  emit();
  return { candidate, application };
}

/**
 * Import CSV : parse un tableau de lignes (chaque ligne est un objet cle/valeur)
 * et cree les candidats + candidatures correspondantes.
 * Retourne le nombre de candidats crees.
 */
export function importCandidatesFromCsv(
  rows: Array<Record<string, string>>,
  jobId: string | undefined,
  addedBy: string,
): number {
  ensureLoaded();
  let count = 0;
  const now = new Date().toISOString();
  const palette = [
    "#1C3D5A", "#7c1d2c", "#0a4d3a", "#062b3e",
    "#6B4423", "#5A2A2A", "#4A3D5A", "#2A4A5A",
  ];

  for (const row of rows) {
    const fullName = (row.nom || row.name || row.fullName || "").trim();
    const email = (row.email || row.mail || "").trim();
    if (!fullName && !email) continue;

    const nameParts = fullName.split(/\s+/).filter(Boolean);
    const initials = nameParts.length >= 2
      ? `${nameParts[0][0]}${nameParts[nameParts.length - 1][0]}`.toUpperCase()
      : fullName.slice(0, 2).toUpperCase();

    const candidate: EmployerCandidate = {
      id: uid("emp-cand"),
      fullName: fullName || email.split("@")[0],
      email,
      phone: (row.telephone || row.phone || row.tel || "").trim() || undefined,
      location: (row.lieu || row.location || row.ville || "").trim() || undefined,
      headline: (row.poste || row.headline || row.titre || "").trim() || undefined,
      bio: undefined,
      experienceYears: row.experience
        ? parseInt(row.experience, 10) || undefined
        : undefined,
      skills: (row.competences || row.skills || "")
        .split(/[,;]/)
        .map((s) => s.trim())
        .filter(Boolean),
      languages: (row.langues || row.languages || "")
        .split(/[,;]/)
        .map((s) => s.trim())
        .filter(Boolean),
      sectors: [],
      avatarColor: palette[count % palette.length],
      initials,
      linkedinUrl: (row.linkedin || "").trim() || undefined,
      cvFileName: undefined,
      source: "csv_import",
      addedBy,
    };

    setCached({ ...cached, candidates: [...cached.candidates, candidate] });

    if (jobId) {
      const app: EmployerApplication = {
        id: uid("emp-app"),
        jobId,
        candidateId: candidate.id,
        status: "received",
        matchScore: 50,
        rating: 0,
        appliedAt: now,
        updatedAt: now,
        events: [
          {
            id: uid("evt"),
            type: "received",
            at: now,
            text: "Importe depuis CSV",
            by: addedBy,
          },
        ],
        order: cached.applications.filter(
          (a) => a.jobId === jobId && a.status === "received",
        ).length,
      };
      setCached({
        ...cached,
        applications: [...cached.applications, app],
      });
    }

    count++;
  }

  persist();
  emit();
  return count;
}
