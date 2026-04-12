import type { Metadata } from "next";
import { Shell } from "@/components/wall/shell";
import { CompaniesExplorer } from "@/components/wall/companies-explorer";
import { fetchAllCompanies, fetchAllJobs } from "@/lib/supabase/queries";

export const metadata: Metadata = {
  title: "Entreprises qui recrutent à Monaco",
  description:
    "Découvrez les entreprises monégasques qui recrutent en ce moment : banques privées, palaces, groupes de yachting, maisons de luxe, cabinets juridiques.",
  alternates: { canonical: "/entreprises" },
};

export const revalidate = 300;

export default async function EntreprisesPage() {
  const [companies, jobs] = await Promise.all([
    fetchAllCompanies(),
    fetchAllJobs(),
  ]);

  // Compter les offres par entreprise
  const counts: Record<string, number> = {};
  for (const j of jobs) {
    counts[j.company.id] = (counts[j.company.id] ?? 0) + 1;
  }

  return (
    <Shell jobs={jobs}>
      <CompaniesExplorer companies={companies} counts={counts} />
    </Shell>
  );
}
