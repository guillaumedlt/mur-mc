import type { Metadata } from "next";
import { EmployerShell } from "@/components/wall/employer/employer-shell";
import { CandidatesPool } from "@/components/wall/employer/candidates-pool";

export const metadata: Metadata = {
  title: "Tous les candidats",
  alternates: { canonical: "/recruteur/candidats" },
  robots: { index: false, follow: false },
};

export default function RecruteurCandidatsPage() {
  return (
    <EmployerShell>
      <CandidatesPool />
    </EmployerShell>
  );
}
