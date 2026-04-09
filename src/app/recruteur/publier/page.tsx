import type { Metadata } from "next";
import { EmployerShell } from "@/components/wall/employer/employer-shell";
import { PublishJobForm } from "@/components/wall/employer/publish-job-form";

export const metadata: Metadata = {
  title: "Publier une offre",
  description: "Publier une offre d'emploi sur Mur.mc.",
  alternates: { canonical: "/recruteur/publier" },
  robots: { index: false, follow: false },
};

export default function PublierPage() {
  return (
    <EmployerShell>
      <PublishJobForm />
    </EmployerShell>
  );
}
