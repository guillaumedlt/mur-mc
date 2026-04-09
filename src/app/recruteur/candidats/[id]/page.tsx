import type { Metadata } from "next";
import { EmployerShell } from "@/components/wall/employer/employer-shell";
import { CandidateDetailWrapper } from "@/components/wall/employer/candidate-detail-wrapper";

export const metadata: Metadata = {
  title: "Fiche candidat",
  alternates: { canonical: "/recruteur/candidats" },
  robots: { index: false, follow: false },
};

export default async function RecruteurCandidatPage(
  props: PageProps<"/recruteur/candidats/[id]">,
) {
  const { id } = await props.params;
  return (
    <EmployerShell>
      <CandidateDetailWrapper id={id} />
    </EmployerShell>
  );
}
