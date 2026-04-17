import type { Job } from "@/lib/data";

/**
 * Filtre les jobs dont le title matche au moins un des keywords (case-insensitive).
 * Utilise `includes` pour supporter les prefixes (ex: "comptab" matche "Comptable").
 *
 * Scalable : si la liste grossit, on pourrait passer a un index Supabase full-text
 * ou pg_trgm — mais pour < 10k jobs, le filtre JS cote serveur est instantane.
 */
export function matchJobsByKeywords(
  jobs: Job[],
  keywords: string[],
): Job[] {
  const needles = keywords.map((k) => k.toLowerCase());
  return jobs.filter((j) => {
    const title = j.title.toLowerCase();
    return needles.some((n) => title.includes(n));
  });
}
