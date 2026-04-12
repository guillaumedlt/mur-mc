"use client";

import { useState } from "react";
import { useUser } from "@/lib/auth";
import { createClient } from "./client";

type MyJob = {
  id: string;
  slug: string;
  title: string;
  type: string;
  level: string;
  sector: string;
  location: string;
  remote: string;
  work_time: string;
  salary_min: number | null;
  salary_max: number | null;
  lang: string;
  short_description: string;
  status: string;
  featured: boolean;
  views: number;
  created_at: string;
  applicationsCount: number;
};

/**
 * Hook client : charge les offres du recruteur connecte depuis Supabase.
 * Pattern "fetch on prop change" sans useEffect/useMemo pour satisfaire
 * le lint react-hooks strict.
 */
export function useMyJobs() {
  const user = useUser();
  const [jobs, setJobs] = useState<MyJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchedFor, setFetchedFor] = useState<string | null>(null);

  // Trigger fetch quand companyId change (y compris au premier render)
  const companyId = user?.companyId ?? null;
  if (companyId !== fetchedFor) {
    setFetchedFor(companyId);
    if (!companyId) {
      setJobs([]);
      setLoading(false);
    } else {
      setLoading(true);
      const supabase = createClient();
      supabase
        .from("jobs")
        .select("*, applications(count)")
        .eq("company_id", companyId)
        .order("created_at", { ascending: false })
        .then(({ data }) => {
          if (data) {
            setJobs(
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              data.map((j: any) => ({
                id: j.id,
                slug: j.slug,
                title: j.title,
                type: j.type,
                level: j.level,
                sector: j.sector,
                location: j.location,
                remote: j.remote,
                work_time: j.work_time,
                salary_min: j.salary_min,
                salary_max: j.salary_max,
                lang: j.lang,
                short_description: j.short_description,
                status: j.status,
                featured: j.featured,
                views: j.views ?? 0,
                created_at: j.created_at,
                applicationsCount:
                  Array.isArray(j.applications) && j.applications.length > 0
                    ? j.applications[0]?.count ?? 0
                    : 0,
              })),
            );
          }
          setLoading(false);
        });
    }
  }

  return { jobs, loading };
}
