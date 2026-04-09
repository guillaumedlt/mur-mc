import type { Metadata } from "next";
import { EmployerShell } from "@/components/wall/employer/employer-shell";
import { AddCandidate } from "@/components/wall/employer/add-candidate";

export const metadata: Metadata = {
  title: "Ajouter des candidats",
  description: "Ajouter des candidats manuellement ou par import CSV.",
  alternates: { canonical: "/recruteur/candidats/ajouter" },
  robots: { index: false, follow: false },
};

export default function AjouterCandidatPage() {
  return (
    <EmployerShell>
      <AddCandidate />
    </EmployerShell>
  );
}
