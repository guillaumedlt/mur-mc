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
};

export function useMyTeam() {
  const user = useUser();
  const [members, setMembers] = useState<TeamMemberRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchedFor, setFetchedFor] = useState<string | null>(null);

  const companyId = user?.companyId ?? null;
  if (companyId !== fetchedFor) {
    setFetchedFor(companyId);
    if (!companyId) {
      setMembers([]);
      setLoading(false);
    } else {
      setLoading(true);
      const supabase = createClient();
      supabase
        .from("profiles")
        .select("id, full_name, email, role, team_role, created_at")
        .eq("company_id", companyId)
        .order("created_at", { ascending: true })
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .then(({ data }: { data: any }) => {
          if (data) {
            const palette = ["#1C3D5A", "#7c1d2c", "#0a4d3a", "#062b3e", "#6B4423"];
            setMembers(
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              data.map((row: any, i: number) => {
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
                };
              }),
            );
          }
          setLoading(false);
        });
    }
  }

  const refetch = () => setFetchedFor(null);

  return { members, loading, refetch };
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
