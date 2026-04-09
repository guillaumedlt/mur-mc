import type { Metadata } from "next";
import { EmployerShell } from "@/components/wall/employer/employer-shell";
import { CompanyEditor } from "@/components/wall/employer/company-editor";

export const metadata: Metadata = {
  title: "Ma fiche entreprise",
  description: "Éditer la fiche publique de mon entreprise sur Mur.mc.",
  alternates: { canonical: "/recruteur/entreprise" },
  robots: { index: false, follow: false },
};

export default function RecruteurEntreprisePage() {
  return (
    <EmployerShell>
      <CompanyEditor />
    </EmployerShell>
  );
}
