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

export async function updateMemberRole(
  memberId: string,
  teamRole: "admin" | "recruiter" | "viewer",
): Promise<void> {
  const supabase = createClient();
  await supabase
    .from("profiles")
    .update({ team_role: teamRole })
    .eq("id", memberId);
}

export async function removeMemberFromCompany(
  memberId: string,
): Promise<void> {
  const supabase = createClient();
  await supabase
    .from("profiles")
    .update({ company_id: null, team_role: null })
    .eq("id", memberId);
}

export async function inviteTeamMember(
  companyId: string,
  email: string,
  teamRole: "admin" | "recruiter" | "viewer",
  invitedBy: string,
  opts?: { companyName?: string; inviterName?: string },
): Promise<{ ok: boolean; error?: string; linked?: boolean }> {
  const supabase = createClient();

  // Check if already invited
  const { data: existing } = await supabase
    .from("team_invitations")
    .select("id")
    .eq("company_id", companyId)
    .eq("email", email)
    .eq("status", "pending")
    .single();

  if (existing) {
    return { ok: false, error: "Cette personne a deja une invitation en attente." };
  }

  // Check if already a member
  const { data: profile } = await supabase
    .from("profiles")
    .select("id, company_id")
    .eq("email", email)
    .single();

  if (profile?.company_id === companyId) {
    return { ok: false, error: "Cette personne fait deja partie de votre equipe." };
  }

  // If they have an account, link them directly
  if (profile) {
    await supabase
      .from("profiles")
      .update({ company_id: companyId, team_role: teamRole })
      .eq("id", profile.id);
    return { ok: true, linked: true };
  }

  // Create a pending invitation
  const { data: inv, error } = await supabase
    .from("team_invitations")
    .insert({
      company_id: companyId,
      email,
      team_role: teamRole,
      invited_by: invitedBy,
    })
    .select("token")
    .single();

  if (error) {
    return { ok: false, error: error.message };
  }

  // Send invitation email via API route
  const roleLabel = teamRole === "admin" ? "Admin" : teamRole === "recruiter" ? "Recruteur" : "Lecteur";
  fetch("/api/invite", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email,
      companyName: opts?.companyName ?? "",
      role: roleLabel,
      inviterName: opts?.inviterName ?? "",
      token: inv?.token ?? "",
    }),
  }).catch(() => {
    // Fire and forget
  });

  return { ok: true, linked: false };
}

export async function revokeInvitation(invitationId: string): Promise<void> {
  const supabase = createClient();
  await supabase
    .from("team_invitations")
    .update({ status: "revoked" })
    .eq("id", invitationId);
}
