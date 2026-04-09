import type { Metadata } from "next";
import { EmployerShell } from "@/components/wall/employer/employer-shell";
import { KanbanPage } from "@/components/wall/employer/kanban-page";

export const metadata: Metadata = {
  title: "Pipeline candidats",
  alternates: { canonical: "/recruteur/offres" },
  robots: { index: false, follow: false },
};

export default async function RecruteurKanbanPage(
  props: PageProps<"/recruteur/offres/[id]/candidats">,
) {
  const { id } = await props.params;
  return (
    <EmployerShell>
      <KanbanPage jobId={id} />
    </EmployerShell>
  );
}
