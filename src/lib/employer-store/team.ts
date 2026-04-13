import type { TeamMember, TeamRole } from "./types";
import { cached, setCached, ensureLoaded, persist, emit, uid } from "./core";

/* ─── Team ───────────────────────────────────────────────────────── */

export function addTeamMember(
  member: Omit<TeamMember, "id" | "addedAt">,
): TeamMember {
  ensureLoaded();
  const created: TeamMember = {
    ...member,
    id: uid("team"),
    addedAt: new Date().toISOString(),
  };
  setCached({ ...cached, team: [...cached.team, created] });
  persist();
  emit();
  return created;
}

export function updateTeamMember(
  id: string,
  patch: Partial<TeamMember>,
): void {
  ensureLoaded();
  setCached({
    ...cached,
    team: cached.team.map((m) => (m.id === id ? { ...m, ...patch } : m)),
  });
  persist();
  emit();
}

export function removeTeamMember(id: string): void {
  ensureLoaded();
  setCached({ ...cached, team: cached.team.filter((m) => m.id !== id) });
  persist();
  emit();
}

export function teamRoleLabel(r: TeamRole): string {
  switch (r) {
    case "admin":
      return "Admin";
    case "recruiter":
      return "Recruteur";
    case "viewer":
      return "Lecteur";
  }
}
