import type { Metadata } from "next";
import { EmployerShell } from "@/components/wall/employer/employer-shell";
import { EmployerJobsList } from "@/components/wall/employer/employer-jobs-list";

export const metadata: Metadata = {
  title: "Mes offres",
  description: "Gérer mes offres d'emploi sur Monte Carlo Work.",
  alternates: { canonical: "/recruteur/offres" },
  robots: { index: false, follow: false },
};

export default function RecruteurOffresPage() {
  return (
    <EmployerShell>
      <EmployerJobsList />
    </EmployerShell>
  );
}
