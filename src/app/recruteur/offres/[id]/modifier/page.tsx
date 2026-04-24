import type { Metadata } from "next";
import { EmployerShell } from "@/components/wall/employer/employer-shell";
import { EditJobPage } from "@/components/wall/employer/edit-job-page";

export const metadata: Metadata = {
  title: "Modifier l'offre",
  robots: { index: false, follow: false },
};

export default async function Page(
  props: { params: Promise<{ id: string }> },
) {
  const { id } = await props.params;
  return (
    <EmployerShell>
      <EditJobPage jobId={id} />
    </EmployerShell>
  );
}
