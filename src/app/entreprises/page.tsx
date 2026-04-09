import type { Metadata } from "next";
import { allJobs, companies, jobCountByCompany } from "@/lib/data";
import { Shell } from "@/components/wall/shell";
import { CompaniesExplorer } from "@/components/wall/companies-explorer";

export const metadata: Metadata = {
  title: "Entreprises qui recrutent à Monaco",
  description:
    "Découvrez les entreprises monégasques qui recrutent en ce moment : banques privées, palaces, groupes de yachting, maisons de luxe, cabinets juridiques.",
  alternates: { canonical: "/entreprises" },
};

export default function EntreprisesPage() {
  const counts = jobCountByCompany();
  return (
    <Shell jobs={allJobs}>
      <CompaniesExplorer companies={companies} counts={counts} />
    </Shell>
  );
}
