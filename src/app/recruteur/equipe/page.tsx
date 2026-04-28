import type { Metadata } from "next";
import { EmployerShell } from "@/components/wall/employer/employer-shell";
import { TeamManagement } from "@/components/wall/employer/team-management";

export const metadata: Metadata = {
  title: "Mon équipe",
  description: "Gérer l'équipe recruteur sur Monte Carlo Work.",
  alternates: { canonical: "/recruteur/equipe" },
  robots: { index: false, follow: false },
};

export default function RecruteurEquipePage() {
  return (
    <EmployerShell>
      <TeamManagement />
    </EmployerShell>
  );
}
