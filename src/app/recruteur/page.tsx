import type { Metadata } from "next";
import { EmployerShell } from "@/components/wall/employer/employer-shell";
import { EmployerDashboard } from "@/components/wall/employer/employer-dashboard";

export const metadata: Metadata = {
  title: "Mon espace recruteur",
  description: "Tableau de bord recruteur sur Mur.mc.",
  alternates: { canonical: "/recruteur" },
  robots: { index: false, follow: false },
};

export default function RecruteurPage() {
  return (
    <EmployerShell>
      <EmployerDashboard />
    </EmployerShell>
  );
}
