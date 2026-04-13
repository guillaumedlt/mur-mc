"use client";

import { useState } from "react";
import { useUser } from "@/lib/auth";
import { createClient } from "./client";

export type MyCompany = {
  id: string;
  slug: string;
  name: string;
  sector: string;
  size: string;
  location: string;
  description: string;
  tagline: string;
  positioning: string;
  culture: string;
  perks: string[];
  website: string;
  domain: string;
  logo_color: string;
  initials: string;
  founded: number | null;
  has_cover: boolean;
  cover_url: string | null;
  blocks: unknown[];
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapCompany(row: any): MyCompany {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    sector: row.sector ?? "",
    size: row.size ?? "",
    location: row.location ?? "Monaco",
    description: row.description ?? "",
    tagline: row.tagline ?? "",
    positioning: row.positioning ?? "",
    culture: row.culture ?? "",
    perks: row.perks ?? [],
    website: row.website ?? "",
    domain: row.domain ?? "",
    logo_color: row.logo_color ?? "#1C3D5A",
    initials: row.initials ?? "",
    founded: row.founded ?? null,
    has_cover: row.has_cover ?? false,
    cover_url: row.cover_url ?? null,
    blocks: Array.isArray(row.blocks) ? row.blocks : [],
  };
}

/**
 * Hook client : charge l'entreprise du recruteur connecte depuis Supabase.
 */
export function useMyCompany() {
  const user = useUser();
  const [company, setCompany] = useState<MyCompany | null>(null);
  const [loading, setLoading] = useState(true);
  const [fetchedFor, setFetchedFor] = useState<string | null>(null);

  const companyId = user?.companyId ?? null;
  if (companyId !== fetchedFor) {
    setFetchedFor(companyId);
    if (!companyId) {
      setCompany(null);
      setLoading(false);
    } else {
      setLoading(true);
      const supabase = createClient();
      supabase
        .from("companies")
        .select("*")
        .eq("id", companyId)
        .single()
        .then(({ data }) => {
          setCompany(data ? mapCompany(data) : null);
          setLoading(false);
        });
    }
  }

  return { company, loading, refetch: () => setFetchedFor(null) };
}

/**
 * Update company in Supabase.
 */
export async function updateCompanySupabase(
  companyId: string,
  patch: Record<string, unknown>,
): Promise<void> {
  const supabase = createClient();
  await supabase.from("companies").update(patch).eq("id", companyId);
}
