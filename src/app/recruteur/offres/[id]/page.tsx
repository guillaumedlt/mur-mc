import type { Metadata } from "next";
import { EmployerShell } from "@/components/wall/employer/employer-shell";
import { EmployerJobDetail } from "@/components/wall/employer/employer-job-detail";

export const metadata: Metadata = {
  title: "Détail de l'offre",
  alternates: { canonical: "/recruteur/offres" },
  robots: { index: false, follow: false },
};

export default async function RecruteurJobPage(
  props: PageProps<"/recruteur/offres/[id]">,
) {
  const { id } = await props.params;
  return (
    <EmployerShell>
      <EmployerJobDetail id={id} />
    </EmployerShell>
  );
}
