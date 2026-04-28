import type { Metadata } from "next";
import { Shell } from "@/components/wall/shell";
import { CompaniesExplorer } from "@/components/wall/companies-explorer";
import { fetchAllCompanies, fetchAllJobs } from "@/lib/supabase/queries";

export const metadata: Metadata = {
  title: "Recrutement Monaco — Entreprises qui recrutent en Principaute | Monte Carlo Work",
  description:
    "Decouvrez les entreprises monegasques qui recrutent en ce moment : banques privees, palaces, groupes de yachting, maisons de luxe, cabinets juridiques. Recrutement Monaco en direct.",
  keywords: ["recrutement Monaco", "entreprises Monaco", "employeurs Monaco", "recrutement Principaute"],
  alternates: { canonical: "/entreprises" },
  openGraph: {
    type: "website",
    title: "Recrutement Monaco — Entreprises qui recrutent",
    description: "Toutes les entreprises qui recrutent en Principaute de Monaco.",
    siteName: "Monte Carlo Work",
    locale: "fr_MC",
  },
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
