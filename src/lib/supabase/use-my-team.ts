"use client";

import { useState } from "react";
import { useUser } from "@/lib/auth";
import { createClient } from "./client";

export type TeamMemberRow = {
  id: string;
  fullName: string;
  email: string;
  role: string;
  teamRole: "admin" | "recruiter" | "viewer";
  avatarColor: string;
  initials: string;
  createdAt: string;
  isPending: false;
};

export type PendingInvitation = {
  id: string;
  email: string;
  teamRole: "admin" | "recruiter" | "viewer";
  createdAt: string;
  isPending: true;
};

export type TeamRow = TeamMemberRow | PendingInvitation;

export function useMyTeam() {
  const user = useUser();
  const [members, setMembers] = useState<TeamMemberRow[]>([]);
  const [invitations, setInvitations] = useState<PendingInvitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchedFor, setFetchedFor] = useState<string | null>(null);

  const companyId = user?.companyId ?? null;
  if (companyId !== fetchedFor) {
    setFetchedFor(companyId);
    if (!companyId) {
      setMembers([]);
      setInvitations([]);
      setLoading(false);
    } else {
      setLoading(true);
      const supabase = createClient();

      Promise.all([
        supabase
          .from("profiles")
          .select("id, full_name, email, role, team_role, created_at")
          .eq("company_id", companyId)
          .order("created_at", { ascending: true }),
        supabase
          .from("team_invitations")
          .select("*")
          .eq("company_id", companyId)
          .eq("status", "pending")
          .order("created_at", { ascending: true }),
      ]).then(([profilesRes, invitesRes]) => {
        const palette = ["#1C3D5A", "#7c1d2c", "#0a4d3a", "#062b3e", "#6B4423"];

        if (profilesRes.data) {
          setMembers(
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            profilesRes.data.map((row: any, i: number) => {
              const name = row.full_name ?? row.email?.split("@")[0] ?? "?";
              const parts = name.split(/\s+/).filter(Boolean);
              const initials =
                parts.length >= 2
                  ? `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase()
                  : name.slice(0, 2).toUpperCase();
              return {
                id: row.id,
                fullName: name,
                email: row.email ?? "",
                role: row.role ?? "employer",
                teamRole: row.team_role ?? "viewer",
                avatarColor: palette[i % palette.length],
                initials,
                createdAt: row.created_at,
                isPending: false as const,
              };
            }),
          );
        }

        if (invitesRes.data) {
          setInvitations(
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            invitesRes.data.map((row: any) => ({
              id: row.id,
              email: row.email,
              teamRole: row.team_role,
              createdAt: row.created_at,
              isPending: true as const,
            })),
          );
        }

        setLoading(false);
      });
    }
  }

  const refetch = () => setFetchedFor(null);

  return { members, invitations, loading, refetch };
}

/**
 * Les mutations d'equipe passent toutes par des API routes serveur
 * (/api/team/*) qui verifient team_role = 'admin' + meme company.
 * Ne jamais faire de .update/.insert/.delete direct sur les tables
 * profiles/team_invitations depuis le client — la RLS + le trigger
 * anti-self-escalation bloqueront, mais les messages d'erreur seraient
 * obscurs et on perd les verifications business (dernier admin, IDOR…).
 */

async function fetchJson(
  input: string,
  init: RequestInit,
): Promise<{ ok: boolean; error?: string; data?: Record<string, unknown> }> {
  try {
    const res = await fetch(input, {
      ...init,
      headers: { "Content-Type": "application/json", ...(init.headers ?? {}) },
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      return { ok: false, error: data?.error ?? `Erreur ${res.status}` };
    }
    return { ok: true, data };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Erreur reseau" };
  }
}

export async function updateMemberRole(
  memberId: string,
  teamRole: "admin" | "recruiter" | "viewer",
): Promise<{ ok: boolean; error?: string }> {
  return fetchJson("/api/team/member", {
    method: "PATCH",
    body: JSON.stringify({ memberId, teamRole }),
  });
}

export async function removeMemberFromCompany(
  memberId: string,
): Promise<{ ok: boolean; error?: string }> {
  return fetchJson(`/api/team/member?id=${encodeURIComponent(memberId)}`, {
    method: "DELETE",
  });
}

export async function inviteTeamMember(
  email: string,
  teamRole: "admin" | "recruiter" | "viewer",
): Promise<{ ok: boolean; error?: string; linked?: boolean; emailSent?: boolean; inviteLink?: string }> {
  const res = await fetchJson("/api/team/invite", {
    method: "POST",
    body: JSON.stringify({ email, teamRole }),
  });
  if (!res.ok) return { ok: false, error: res.error };
  return {
    ok: true,
    linked: Boolean(res.data?.linked),
    emailSent: Boolean(res.data?.emailSent),
    inviteLink: typeof res.data?.inviteLink === "string" ? res.data.inviteLink : undefined,
  };
}

export async function revokeInvitation(
  invitationId: string,
): Promise<{ ok: boolean; error?: string }> {
  return fetchJson(`/api/team/invitation?id=${encodeURIComponent(invitationId)}`, {
    method: "DELETE",
  });
}
